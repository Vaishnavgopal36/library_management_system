/**
 * Truncates a book title (or any string) to `maxLength` characters.
 * Appends "..." when the string exceeds the limit.
 *
 * @param title     - The string to truncate.
 * @param maxLength - Maximum number of characters before truncation (default 20).
 * @returns The original string if ≤ maxLength, otherwise the first `maxLength`
 *          characters followed by "...".
 *
 * @example
 *   truncateTitle("The Great Gatsby")           // "The Great Gatsby"   (16 chars, unchanged)
 *   truncateTitle("The Adventures of Tom Sawyer") // "The Adventures of To..."
 *   truncateTitle(null)                           // ""
 */
export function truncateTitle(title: string | null | undefined, maxLength = 20): string {
  if (!title) return '';
  return title.length <= maxLength ? title : title.slice(0, maxLength) + '...';
}
