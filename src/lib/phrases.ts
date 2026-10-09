export function splitPhrases(value: string | null | undefined): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of value.split(/[;；]/)) {
    const trimmed = part.replace(/\s+/g, " ").trim();
    const key = trimmed.toLowerCase();
    if (trimmed.length < 2 || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}
