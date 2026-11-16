const TAG_FILLS = [
  "bg-accent text-accent-ink",
  "bg-accent-2 text-accent-ink",
  "bg-accent-3 text-ink",
] as const;

export function tagFill(tag: string): string {
  let hash = 0;
  for (const char of tag) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }
  return TAG_FILLS[hash % TAG_FILLS.length];
}
