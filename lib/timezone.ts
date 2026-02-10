/**
 * Timezone Utility for Web Frontend
 * Standardizes all date/time operations to AEDT UTC+11 (Australia/Sydney)
 */

const TIMEZONE = 'Australia/Sydney'; // AEDT UTC+11

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
  // datetime-local format: "2025-12-16T08:15"
  // Treat as Sydney time and return ISO string
  if (!dateStr) return '';
  
  const [datePart, timePart] = dateStr.split('T');
  if (!datePart || !timePart) return dateStr;
  
  // Create date in Sydney timezone
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create date object in Sydney timezone
  const sydneyDate = new Date();
  sydneyDate.setFullYear(year, month - 1, day);
  sydneyDate.setHours(hours, minutes, 0, 0);
  
  // Convert to ISO string (UTC)
  // Adjust for Sydney timezone offset (UTC+11)
  const utcDate = new Date(sydneyDate.getTime() - (11 * 60 * 60 * 1000));
  
  return utcDate.toISOString();
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

