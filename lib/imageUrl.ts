/**
 * Get full image URL from relative path or full URL
 * Handles both relative paths (uploads/filename.jpg) and full URLs
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // If already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If relative path, prepend API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  // Remove leading slash if present
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${apiUrl}/${cleanPath}`;
}

