const KEY = "wish-favorites";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
}

export function getFavoriteIds(): string[] {
  return read();
}

export function isFavorite(id: string): boolean {
  return read().includes(id);
}

export function toggleFavorite(id: string): boolean {
  const current = read();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  write(next);
  return next.includes(id);
}
