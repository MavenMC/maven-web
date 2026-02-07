const SUMMARY_LIMIT = 180;

export function buildSummary(summary: string | null, content: string | null) {
  const trimmedSummary = summary?.trim();
  if (trimmedSummary) return trimmedSummary;
  if (!content) return null;

  const cleaned = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+]\([^)]+\)/g, " ")
    .replace(/[#>*_~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return null;
  return cleaned.length > SUMMARY_LIMIT
    ? `${cleaned.slice(0, SUMMARY_LIMIT).trim()}...`
    : cleaned;
}

export function resolveCoverLabel(coverLabel: string | null, tag: string | null) {
  const trimmedLabel = coverLabel?.trim();
  if (trimmedLabel) return trimmedLabel;
  return tag ? tag.toUpperCase() : null;
}
