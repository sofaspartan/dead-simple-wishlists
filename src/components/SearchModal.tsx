import { Search as SearchIcon, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { api, type Wishlist } from "../api";
import { CardGridSkeleton } from "./Skeleton";

type Props = {
  open: boolean;
  onClose: () => void;
};

function portalTarget(): HTMLElement {
  return document.querySelector<HTMLElement>(".phone-frame") ?? document.body;
}

export default function SearchModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);

    setLoading(true);
    setError("");
    void (async () => {
      try {
        const res = await api.listWishlists();
        setWishlists(res.wishlists);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();

    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wishlists;
    return wishlists.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.items.some((i) => i.name.toLowerCase().includes(q)),
    );
  }, [wishlists, query]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="app-modal-root" role="presentation">
      <button type="button" className="app-modal-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="app-modal app-modal-tall"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="app-modal-header">
          <h2 id={titleId} className="app-modal-title">
            Search
          </h2>
          <button type="button" className="app-modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <label className="search-field app-modal-search">
          <span className="search-field-icon" aria-hidden="true">
            <SearchIcon size={20} strokeWidth={1.75} />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Wishlists or wishes"
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <div className="app-modal-body">
          {loading ? (
            <CardGridSkeleton count={4} label="Loading wishlists" />
          ) : filtered.length === 0 ? (
            <p className="muted lead-center" style={{ margin: "1rem 0" }}>
              {query.trim() ? "No matches" : "No wishlists yet"}
            </p>
          ) : (
            <ul className="app-modal-list">
              {filtered.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    className="app-modal-row"
                    onClick={() => {
                      onClose();
                      navigate(`/app/lists/${w.id}`);
                    }}
                  >
                    <span className="app-modal-row-title">{w.title}</span>
                    <span className="app-modal-row-meta">
                      {w.items.length} wish{w.items.length === 1 ? "" : "es"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    portalTarget(),
  );
}
