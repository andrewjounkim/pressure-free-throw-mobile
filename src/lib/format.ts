/** Shows a score, or an em dash when there isn't one yet. */
export const formatScore = (value: number | null) => (value === null ? '—' : String(value));
