# Prezzee — UNICASH Gift Card provider integration

> Status: **PLANNED** · Provider: Prezzee Smart eGift Cards API
> Owner: TBD · Last updated: 2026-05-11

Prezzee is UNICASH's primary gift card fulfillment provider. They
publish an REST API that covers every AU top-tier brand we ship
today (Coles, Woolworths, BP, JB Hi-Fi, Bunnings, Westfield, Myer,
Uber, and more). This document is the source-of-truth for how we
plan to integrate. The mock-data layer in `mock-data.ts` already
models brands + providers exactly as Prezzee returns them, so the
swap should be a thin adapter layer.

---

## 1. Why Prezzee

| Criterion | Prezzee | InComm | Blackhawk | GiVV |
|---|---|---|---|---|
| AU brand coverage (Coles, Woolies, BP, JB, Bunnings…) | ✅ All | partial | partial | partial |
| Instant digital delivery | ✅ | ✅ | ✅ | varies |
| Australian entity / GST invoicing | ✅ Sydney | US-billing | US-billing | mixed |
| Bulk B2B API maturity | ✅ Stable v2 | ✅ | ✅ | newer |
| Sandbox quality | ✅ | average | average | average |
| Webhook fulfillment confirmation | ✅ | ✅ | ✅ | ✅ |
| Margin tiers (volume discounts) | ✅ | flat | flat | flat |

Verdict: ship with Prezzee as primary, keep the others as documented
failover SKUs for the rare case Prezzee can't fulfill a specific
denomination or is degraded.

---

## 2. Auth + environments

| Env | Base URL | Auth |
|---|---|---|
| Sandbox | `https://api.sandbox.prezzee.com/v2` | API key + HMAC signature header |
| Production | `https://api.prezzee.com/v2` | Same |

Secrets stored in `PREZZEE_API_KEY` + `PREZZEE_API_SECRET` env vars.
Never logged. Mock layer reads neither — purely shape-matching.

---

## 3. Endpoints we plan to consume

### 3.1 Catalog sync — `GET /v2/products`
Pulls every product Prezzee can fulfill for our account. We map their
response into our `Brand` + `Denomination` shape, store snapshots in
`brands` + `denominations` tables, and let admins curate which we
publish on the member catalog.

Run frequency: **nightly via BullMQ** (`prezzee:catalog-sync` job).
Drift between Prezzee SKU + our row is surfaced in `/admin/gift-cards/providers`.

Mapping (Prezzee → UNICASH):

```
product.sku           → denomination.providerSku
product.brand_name    → brand.name
product.face_value    → denomination.valueAud
product.our_cost      → denomination.providerCostAud
product.stock_state   → denomination.stockLevel
product.image_url     → brand.logoUrl (cached + re-uploaded to our CDN)
product.terms_html    → brand.terms (sanitised)
product.delivery      → brand.deliveryType ('instant' | 'review')
```

### 3.2 Place order — `POST /v2/orders`

Called at the moment the member taps **Confirm and redeem** on the
checkout flow's Review pane. Idempotency-keyed on our redemption id
so retries can't double-issue codes.

Request body:
```json
{
  "idempotency_key": "RDM-218041",
  "items": [{ "sku": "PRZ-COLES-050", "quantity": 1 }],
  "delivery": { "method": "api", "email": "charlotte.n@example.com" },
  "metadata": { "memberId": "M-10421", "channel": "web" }
}
```

Response (synchronous, ≤2s typical):
```json
{
  "order_id": "prezzee_ord_2026_R8x912",
  "status": "completed" | "processing" | "rejected",
  "codes": [{
    "code": "COLES-2841-9F2K-1934",
    "pin": "4821",
    "expires_at": "2029-05-11T00:00:00Z"
  }],
  "rejected_reason": null
}
```

Ledger contract:
- `status: completed` + codes returned → debit Points immediately, mark `redemption.status='completed'`
- `status: processing` → leave reservation open, wait for webhook
- `status: rejected` → release reservation, mark `redemption.status='failed'` with reason

### 3.3 Webhook — fulfillment confirmation

Prezzee POSTs to `https://api.unicash.com.au/webhooks/prezzee` when an
asynchronous order completes (rare — usually the synchronous response
already carries codes). Same payload shape as the order response,
with `order_id` as the join key.

Webhook idempotency: piggyback on the existing Phase PB3 pattern.
Add a `prezzee_event_log` table (or extend `stripe_event_log` to a
generic `provider_event_log` with `provider` column — preferred).

### 3.4 Order status — `GET /v2/orders/{id}`

Used by:
- Admin redemption detail "Provider" tab (read fresh status)
- Daily reconciliation cron — confirm every "completed" redemption
  also matches a Prezzee `completed` order

### 3.5 Refund / reissue — `POST /v2/orders/{id}/refund` and `/reissue`

Both gated to admin actions only. Required reason captured on our
side first, then forwarded to Prezzee for their audit trail.

Code revealed?
- Yes → only `reissue` (Prezzee won't refund a revealed code)
- No → `refund` allowed

This mirrors the spec §9.7 rule and the UI in 8.4 already enforces it.

---

## 4. Failure handling

| Prezzee response | UNICASH redemption status | Member-facing reason |
|---|---|---|
| HTTP 200 `status: completed` | `completed` | n/a — success path |
| HTTP 200 `status: processing` | `on_hold` | "On hold — under review" |
| HTTP 200 `status: rejected` (insufficient stock) | `failed` | `out_of_stock` |
| HTTP 200 `status: rejected` (fraud / risk) | `failed` | `fraud_rejected` (Points refunded) |
| HTTP 4xx (validation) | `failed` | `provider_error` (Points not debited) |
| HTTP 5xx / timeout | `failed` | `provider_error` (Points refunded if debit already committed; else `network_failure`) |
| No response after 30s | `on_hold` | "On hold" — webhook will reconcile |

Every failure routes through the same ledger rules in spec §9 and the
copy variants already shipped in `checkout-flow.tsx`.

---

## 5. Reconciliation

Daily 03:00 Sydney cron (extend the existing
`ReconciliationSchedulerService`) compares:

- Our `redemptions` rows with `status='completed'`
- Prezzee `/v2/orders?status=completed&date=YYYY-MM-DD`

Discrepancies surface in the admin Reconciliation drawer (already
wired in Phase 5) with diff fields. Margin calc: per row,
`valueAud - providerCostAud` from the invoice Prezzee files at
month-end.

---

## 6. Implementation phases

| Phase | Scope | Status |
|---|---|---|
| **G1–G7** | UI for catalog, checkout, history, receipt, admin queue, providers, reports — all with mock data shaped exactly like Prezzee | ✅ G1–G4 shipped |
| **GP1** | Prezzee adapter service `unicash-api/src/integrations/prezzee/*` — auth, HMAC signing, request/response types, error mapping | pending |
| **GP2** | Catalog sync BullMQ job (nightly) + admin "Sync now" button | pending |
| **GP3** | Wire `POST /admin/redemptions` route to call Prezzee's order endpoint, plus webhook receiver with provider_event_log idempotency | pending |
| **GP4** | Admin refund / reissue actions hit Prezzee endpoints + log activity | pending |
| **GP5** | Reconciliation daily diff | pending |

UI is already deliberately shape-aligned with Prezzee so GP1–GP5
should ship without churning the frontend.

---

## 7. Open questions / risks

- **Volume discount tier**: Prezzee bands AUD margin at A$50k, A$200k,
  A$500k monthly turnover. We need projected redemption volume before
  signing.
- **GST**: Prezzee invoices monthly with GST included. The `providerCostAud`
  in our `Denomination` rows must store the GST-inclusive cost so the
  margin calc isn't off.
- **Sandbox brand list** is smaller than production — plan QA accordingly.
- **PII**: Prezzee receives the member's email for delivery. Document this
  in the privacy policy update before launch.
- **Code storage**: Prezzee returns plaintext codes; we encrypt at rest
  (already in spec §10). Reveal is logged. Confirm Prezzee TOS allows
  storage of issued codes for the 2-year warranty window.

---

## 8. Action items before GP1

1. Sign Prezzee partner agreement, get sandbox credentials
2. Map every brand currently in the mock catalog to a real Prezzee SKU
3. Decide encryption-at-rest approach (AWS KMS vs Postgres pgcrypto)
4. Add `PREZZEE_API_KEY`, `PREZZEE_API_SECRET`, `PREZZEE_WEBHOOK_SECRET`
   to env config + secret manager
5. Provisional contract: legal + finance review on margin tiers
