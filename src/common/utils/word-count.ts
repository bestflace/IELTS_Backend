export function countWords(text: string): number {
  const normalized = text.trim();

  if (!normalized) {
    return 0;
  }

  return normalized.split(/\s+/).filter(Boolean).length;
}
