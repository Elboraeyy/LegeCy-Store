
/**
 * Optimizes Cloudinary URLs by adding auto-format, auto-quality, and width constraints.
 * If the URL is not from Cloudinary, returns the original URL.
 */
export function optimizeCloudinaryUrl(url: string, width: number = 800): string {
  if (!url || !url.includes('res.cloudinary.com')) {
    return url;
  }

  // Check if it's already an upload URL
  if (url.includes('/image/upload/')) {
    // Avoid double transformation
    if (url.includes('/f_auto,q_auto')) {
      return url;
    }
    
    // Insert transformation after /upload/
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/f_auto,q_auto,w_${width},c_limit/${parts[1]}`;
    }
  }

  return url;
}
