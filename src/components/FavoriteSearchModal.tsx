import { Search as SearchIcon, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Wishlist } from "../api";

type Props = {
  open: boolean;
  onClose: () => void;
  wishlists: Wishlist[];
  favoritedIds: string[];
  onPick: (id: string) => void;
};

function portalTarget(): HTMLElement {
  return document.querySelector<HTMLElement>(".phone-frame") ?? document.body;
}

export default function FavoriteSearchModal({
  open,
  onClose,
  wishlists,
  favoritedIds,
  onPick,
}: Props) {
  const titleId = useId();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const candidates = useMemo(() => {
    const fav = new Set(favoritedIds);
    const available = wishlists.filter((w) => !fav.has(w.id));
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.items.some((i) => i.name.toLowerCase().includes(q)),
    );
  }, [wishlists, favoritedIds, query]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fav-search-root" role="presentation">
      <button type="button" className="fav-search-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="fav-search-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="fav-search-header">
          <h2 id={titleId} className="fav-search-title">
            Add to favorites
          </h2>
          <button type="button" className="fav-search-close" aria-label="Close" onClick={onClose}>
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <label className="search-field fav-search-field">
          <span className="search-field-icon" aria-hidden="true">
            <SearchIcon size={20} strokeWidth={1.75} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search wishlists"
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>

        <ul className="fav-search-results">
          {candidates.length === 0 ? (
            <li className="fav-search-empty muted">
              {wishlists.every((w) => favoritedIds.includes(w.id))
                ? "All wishlists are already favorited"
                : query.trim()
                  ? "No matches"
                  : "No wishlists to add"}
            </li>
          ) : (
            candidates.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  className="fav-search-result"
                  onClick={() => {
                    onPick(w.id);
                    onClose();
                  }}
                >
                  <span className="fav-search-result-title">{w.title}</span>
                  <span className="fav-search-result-meta">
                    {w.items.length} wish{w.items.length === 1 ? "" : "es"}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>,
    portalTarget(),
  );
}
