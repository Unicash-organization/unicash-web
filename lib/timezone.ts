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
  return formatSydneyDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
  const sydneyDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
  
  const hours = sydneyDate.getHours();
  const minutes = sydneyDate.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  const time = `${displayHours}:${displayMinutes}${ampm}`;
  
  const day = sydneyDate.getDate().toString().padStart(2, '0');
  const month = (sydneyDate.getMonth() + 1).toString().padStart(2, '0');
  const year = sydneyDate.getFullYear().toString().slice(-2);
  
  return `${time}, ${day}/${month}/${year}`;
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
  
  // Convert to Sydney timezone
  const sydneyDate = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
  
  const year = sydneyDate.getFullYear();
  const month = String(sydneyDate.getMonth() + 1).padStart(2, '0');
  const day = String(sydneyDate.getDate()).padStart(2, '0');
  const hours = String(sydneyDate.getHours()).padStart(2, '0');
  const minutes = String(sydneyDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

