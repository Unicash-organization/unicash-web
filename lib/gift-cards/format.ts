/**
 * UNICASH Redeem Gift Cards — format helpers.
 * Always go through these — never inline `Intl` calls in components.
 */

const AUD_FORMATTER = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
});

const AUD_CENTS_FORMATTER = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUMBER_FORMATTER = new Intl.NumberFormat('en-AU');

export function formatAud(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return AUD_FORMATTER.format(n);
}

export function formatAudCents(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return AUD_CENTS_FORMATTER.format(n);
}

export function formatPts(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${NUMBER_FORMATTER.format(n)} pts`;
}

/** Compact Points: 84,200 → "84.2K", 1,240,000 → "1.2M". */
export function formatPtsCompact(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M pts`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K pts`;
  return `${n} pts`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return NUMBER_FORMATTER.format(n);
}

export function formatPercent(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toFixed(digits)}%`;
}

export function formatDate(iso?: string | Date | null): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-AU', {
    timeZone: 'Australia/Sydney',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso?: string | Date | null): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelative(iso?: string | Date | null): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  const ms = Date.now() - d.getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 30 * 86_400_000) return `${Math.floor(ms / 86_400_000)}d ago`;
  return formatDate(iso);
}

/** Mask a code so we never render the full string in lists. */
export function maskCode(code: string): string {
  if (!code) return '••••';
  const tail = code.slice(-4);
  return `••••-••••-${tail}`;
}

/** Mask email so PII never renders without an explicit reveal. */
export function maskEmail(email?: string | null): string {
  if (!email) return '—';
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const head = user.slice(0, 2);
  return `${head}${'•'.repeat(Math.max(user.length - 2, 1))}@${domain}`;
}
