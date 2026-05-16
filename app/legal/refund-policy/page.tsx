import { Metadata } from 'next';
import Link from 'next/link';

/**
 * /legal/refund-policy
 *
 * AU-04 (PRE_GOLIVE_REPORT_2026-05-15) — required by AU Consumer Law disclosure
 * + linked from Footer.tsx LEGAL_LINKS. The full body text below is a
 * STUB drafted from the ACCC consumer-guarantee summary; a lawyer should
 * tighten the language before public launch. The intent here is to ship a
 * non-404 destination so the footer link works, with copy a paying member
 * would find acceptable in the meantime.
 *
 * Follow-up TICK-XXX: replace with legal-reviewed version + load body
 * from the `settings` table key `refund_policy` so non-engineering can
 * edit without a deploy.
 */

export const metadata: Metadata = {
  title: 'Refund Policy — UNICASH',
  description:
    'How UNICASH handles refunds for Memberships, Point Boosters, and Gift Card redemptions under Australian Consumer Law.',
};

const SECTIONS: Array<{ heading: string; body: string[] }> = [
  {
    heading: '1. Your rights under Australian Consumer Law',
    body: [
      'Goods and services we supply come with statutory consumer guarantees that cannot be excluded under the Australian Consumer Law (ACL). If a service fails to meet a consumer guarantee, you are entitled to a remedy — a re-supply, refund, or compensation — depending on the failure type.',
      'Nothing in this policy limits your rights under the ACL. Where there is a conflict between this policy and the ACL, the ACL applies.',
    ],
  },
  {
    heading: '2. Membership refunds',
    body: [
      'Membership is billed monthly. You can cancel at any time from your dashboard; cancellation stops future renewals and you retain access until the end of the paid billing period.',
      'Change of mind: we do not refund the unused portion of a paid month for change-of-mind cancellations. The Membership continues to apply Points and benefits to your account through the rest of the period.',
      'Major failure: if the Membership service is materially defective, unavailable, or substantially different from what was promised, contact us within 30 days and we will refund the affected period in full.',
    ],
  },
  {
    heading: '3. Point Booster refunds',
    body: [
      'Point Boosters are one-time purchases that credit Points to your account on the same day. Because the Points are issued and consumable immediately, Point Booster purchases are non-refundable for change of mind.',
      'If the Points were not credited due to a system error, contact us within 14 days and we will either credit the missing Points or refund the purchase, at your choice.',
    ],
  },
  {
    heading: '4. Gift Card redemption refunds',
    body: [
      'Gift Cards issued through the UNICASH redemption flow are provided by third-party retailers and are subject to those retailers’ terms.',
      'If a Gift Card is never delivered, is delivered as an invalid / already-used code, or arrives more than 72 hours after the “delivery” status was set, contact us within 14 days and we will reissue the Gift Card or refund the Points used to redeem it.',
    ],
  },
  {
    heading: '5. Bonus Draw entries',
    body: [
      'Entries to Bonus Draws are not refundable once submitted. If a Bonus Draw is cancelled by UNICASH before the close time, all entries spent on that draw are refunded in full to your Points balance automatically.',
    ],
  },
  {
    heading: '6. How to request a refund',
    body: [
      'Email support@unicash.com.au with: your account email, the order ID (visible in Purchase History), the date of purchase, and a brief description of the issue. We respond within 5 business days.',
      'For Major Failure or ACL-protected claims, you do not need to wait for our response before escalating to the ACCC or your state consumer-protection agency.',
    ],
  },
  {
    heading: '7. Processing time',
    body: [
      'Approved refunds are issued back to the original payment method. Card refunds typically appear within 5–10 business days; the exact timing depends on your card issuer.',
    ],
  },
];

export default function RefundPolicyPage() {
  return (
    <main className="bg-[#FBFAFF] py-16">
      <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6356E5]">
          Legal
        </p>
        <h1 className="mt-2 text-[34px] font-extrabold tracking-tight leading-[1.1] text-[#0F1222] sm:text-[42px]">
          Refund Policy
        </h1>
        <p className="mt-3 text-[14px] text-[#667085]">
          Last updated: 2026-05-15
        </p>

        <div className="mt-10 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="text-[18px] font-extrabold tracking-tight text-[#0F1222] sm:text-[20px]">
                {section.heading}
              </h2>
              {section.body.map((p, i) => (
                <p
                  key={i}
                  className="mt-3 text-[14.5px] leading-relaxed text-[#3F445C]"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-[#E0DAFF] bg-white p-5 sm:p-6">
          <p className="text-[13px] font-extrabold tracking-tight text-[#0F1222]">
            Need help with a refund?
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[#4B5563]">
            Our support team is based in Australia. Email{' '}
            <a
              href="mailto:support@unicash.com.au"
              className="font-semibold text-[#6356E5] underline-offset-2 hover:underline"
            >
              support@unicash.com.au
            </a>
            {' '}or visit our{' '}
            <Link
              href="/contact"
              className="font-semibold text-[#6356E5] underline-offset-2 hover:underline"
            >
              Contact page
            </Link>
            .
          </p>
        </div>

        <p className="mt-10 text-[12px] text-[#667085]">
          UNICASH Pty Ltd · ABN 90 693 062 538 · 45 St Georges Terrace, Perth WA 6000.
        </p>
      </div>
    </main>
  );
}
