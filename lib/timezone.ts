/**
 * Timezone Utility for Web Frontend
 * Display and parsing use IANA Australia/Sydney (AEST UTC+10 or AEDT UTC+11 depending on DST).
 */

const TIMEZONE = 'Australia/Sydney';

function wallTimeInTimeZoneToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
  second = 0,
): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const read = (ms: number) => {
    const parts = formatter.formatToParts(new Date(ms));
    const n = (type: Intl.DateTimeFormatPartTypes) =>
      parseInt(parts.find((p) => p.type === type)?.value ?? 'NaN', 10);
    return {
      y: n('year'),
      m: n('month'),
      d: n('day'),
      h: n('hour'),
      mi: n('minute'),
      s: n('second'),
    };
  };

  const target = { y: year, m: month, d: day, h: hour, mi: minute, s: second };

  const cmp = (
    a: ReturnType<typeof read>,
    b: { y: number; m: number; d: number; h: number; mi: number; s: number },
  ) => {
    if (a.y !== b.y) return a.y - b.y;
    if (a.m !== b.m) return a.m - b.m;
    if (a.d !== b.d) return a.d - b.d;
    if (a.h !== b.h) return a.h - b.h;
    if (a.mi !== b.mi) return a.mi - b.mi;
    return a.s - b.s;
  };

  let lo = Date.UTC(year, month - 1, day, 0, 0, 0) - 24 * 3600000;
  let hi = Date.UTC(year, month - 1, day, 23, 59, 59) + 24 * 3600000;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const cur = read(mid);
    const c = cmp(cur, target);
    if (c === 0) {
      const d = new Date(mid);
      d.setUTCMilliseconds(0);
      return cmp(read(d.getTime()), target) === 0 ? d : new Date(mid);
    }
    if (c < 0) lo = mid + 1;
    else hi = mid - 1;
  }

  const start = Date.UTC(year, month - 1, day, 0, 0, 0) - 26 * 3600000;
  const end = Date.UTC(year, month - 1, day, 23, 59, 59) + 26 * 3600000;
  for (let ms = start; ms <= end; ms += 60000) {
    if (cmp(read(ms), target) === 0) {
      const d = new Date(ms);
      d.setUTCMilliseconds(0);
      return cmp(read(d.getTime()), target) === 0 ? d : new Date(ms);
    }
  }

  throw new Error(
    `Could not map wall time ${year}-${month}-${day}T${hour}:${minute} to UTC in ${timeZone}`,
  );
}

/**
 * Format date for display in Sydney timezone
 */
export function formatSydneyDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  
  return new Intl.DateTimeFormat('en-AU', { ...defaultOptions, ...options }).format(d);
}

/**
 * Format date only (no time) in Sydney timezone
 */
export function formatSydneyDateOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Use separate formatter without hour and minute to avoid showing time
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Format date only (no time) in UTC timezone
 * Used for membership period dates to match Stripe's display
 * Stripe displays dates in UTC, so we format in UTC to match
 * IMPORTANT: Extract UTC date components directly to avoid timezone conversion issues
 */
export function formatUTCDateOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Extract UTC date components directly (not through formatter)
  // This ensures we get the UTC date regardless of how the Date object was created
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth(); // 0-11
  const day = d.getUTCDate();
  
  // Format using UTC components
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${monthNames[month]} ${year}`;
}

/**
 * Format time only in Sydney timezone
 */
export function formatSydneyTimeOnly(date: Date | string): string {
  return formatSydneyDate(date, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date in en-GB style (DD MMM YYYY) in Sydney timezone
 */
export function formatDateGB(date: Date | string): string {
  return formatSydneyDate(date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date with time in Sydney timezone
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Use Intl.DateTimeFormat to get date components in Sydney timezone
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  
  const parts = formatter.formatToParts(d);
  const hour = parts.find(p => p.type === 'hour')?.value || '';
  const minute = parts.find(p => p.type === 'minute')?.value || '';
  const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const year = parts.find(p => p.type === 'year')?.value || '';
  
  const time = `${hour}:${minute}${dayPeriod}`;
  const dateStr = `${day}/${month}/${year.slice(-2)}`;
  
  return `${time}, ${dateStr}`;
}

/**
 * Closed / draw times in 24-hour form, same Australia/Sydney wall clock as admin
 * (`toDateTimeLocalSydney`). Example: "20:30, 15/08/26" — aligns with admin Closed Date.
 */
export function formatSydneyDateTime24h(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const day = parts.find((p) => p.type === 'day')?.value || '';
  const hour = parts.find((p) => p.type === 'hour')?.value || '';
  const minute = parts.find((p) => p.type === 'minute')?.value || '';

  return `${hour}:${minute}, ${day}/${month}/${year.slice(-2)}`;
}

/**
 * Get current date/time in Sydney timezone
 */
export function getSydneyNow(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
}

/**
 * Parse datetime-local input as Sydney time
 * Used for form inputs
 */
export function parseDateTimeLocalAsSydney(dateStr: string): string {
  if (!dateStr) return '';

  const [datePart, timePart] = dateStr.split('T');
  if (!datePart || !timePart) return dateStr;

  const [year, month, day] = datePart.split('-').map(Number);
  const timeBits = timePart.split(':').map(Number);
  const hours = timeBits[0];
  const minutes = timeBits[1];
  const seconds = timeBits.length > 2 && !Number.isNaN(timeBits[2]) ? timeBits[2] : 0;

  return wallTimeInTimeZoneToUtc(year, month, day, hours, minutes, TIMEZONE, seconds).toISOString();
}

/**
 * Convert UTC date to datetime-local format for Sydney timezone
 * Used for form inputs
 */
export function toDateTimeLocalSydney(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Use Intl.DateTimeFormat to get date components in Sydney timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  // Format the date
  const parts = formatter.formatToParts(d);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const hour = parts.find(p => p.type === 'hour')?.value || '';
  const minute = parts.find(p => p.type === 'minute')?.value || '';
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

