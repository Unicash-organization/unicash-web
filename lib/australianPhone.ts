/**
 * Australian mobile display + input formatting (04XX XXX XXX).
 * Shared with checkout and major-draw landing modal.
 */
export function formatAustralianPhone(value: string): string {
  let cleaned = value.replace(/\D/g, '');

  if (cleaned.length > 0 && !cleaned.startsWith('04')) {
    if (cleaned === '0' || cleaned.startsWith('04')) {
      // allow 0 or 04
    } else {
      return '';
    }
  }

  if (cleaned.length > 10) {
    cleaned = cleaned.substring(0, 10);
  }

  if (cleaned.length > 6) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
  }
  if (cleaned.length > 4) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
  }
  return cleaned;
}

/** Convert stored DB phone (+614… / 04…) to display format 04XX XXX XXX (same as checkout). */
export function displayAustralianPhoneFromStored(phone: string | null | undefined): string {
  if (!phone?.trim()) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('614') && cleaned.length === 11) {
    return formatAustralianPhone(`0${cleaned.slice(2)}`);
  }
  if (cleaned.startsWith('04') && cleaned.length === 10) {
    return formatAustralianPhone(cleaned);
  }
  return '';
}
