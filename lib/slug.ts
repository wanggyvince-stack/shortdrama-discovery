/**
 * Generate URL-friendly slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')    // Remove leading/trailing hyphens
    .substring(0, 100);       // Limit length
}

/**
 * Generate unique slug with suffix if needed
 */
export function generateUniqueSlug(title: string, suffix?: string): string {
  const baseSlug = generateSlug(title);
  if (suffix) {
    return `${baseSlug}-${suffix}`;
  }
  return baseSlug;
}

/**
 * Check if slug is valid
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
