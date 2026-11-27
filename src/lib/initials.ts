export function initialsFromName(name?: string | null, fallback = "?"): string {
  const cleaned = (name || "").trim();
  if (!cleaned) return fallback;
  const parts = cleaned.replace(/^@/, "").split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}
