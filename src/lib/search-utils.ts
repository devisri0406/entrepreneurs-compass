// Escape user input for safe use in a PostgREST .ilike pattern within an .or() filter.
// PostgREST parses commas, parentheses, and dots as filter syntax; also % and _ are LIKE wildcards.
export function escapeIlikePattern(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/[,()]/g, " ")
    .trim();
}

export function sanitizeSearchTerm(input: string, maxLen = 100): string {
  return input
    .slice(0, maxLen)
    .replace(/[\x00-\x1f\x7f]/g, "") // Remove control characters
    .replace(/[;'"]/g, "") // Block SQL injection special characters
    .trim();
}
