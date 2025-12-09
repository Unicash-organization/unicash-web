/**
 * Generate a device fingerprint for fraud detection
 * Combines browser/device characteristics to create a unique identifier
 */
export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  const components: string[] = [];

  // User agent
  if (navigator.userAgent) {
    components.push(navigator.userAgent);
  }

  // Language
  if (navigator.language) {
    components.push(navigator.language);
  }

  // Screen resolution
  if (screen.width && screen.height) {
    components.push(`${screen.width}x${screen.height}`);
  }

  // Color depth
  if (screen.colorDepth) {
    components.push(`color${screen.colorDepth}`);
  }

  // Timezone
  if (Intl.DateTimeFormat().resolvedOptions().timeZone) {
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }

  // Platform
  if (navigator.platform) {
    components.push(navigator.platform);
  }

  // Hardware concurrency (CPU cores)
  if (navigator.hardwareConcurrency) {
    components.push(`cores${navigator.hardwareConcurrency}`);
  }

  // Create a hash-like string from components
  const fingerprintString = components.join('|');
  
  // Simple hash function (not cryptographically secure, but good enough for fingerprinting)
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Add a random component to make it unique per browser instance
  const random = Math.random().toString(36).substring(2, 15);
  
  return `fp-${Math.abs(hash).toString(36)}-${random}`;
}

/**
 * Get or create device fingerprint (stored in localStorage)
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  const storageKey = 'unicash_device_fingerprint';
  let fingerprint = localStorage.getItem(storageKey);

  if (!fingerprint) {
    fingerprint = generateDeviceFingerprint();
    localStorage.setItem(storageKey, fingerprint);
  }

  return fingerprint;
}

