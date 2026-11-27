import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import type { Wishlist } from "../api";

type Props = {
  open: boolean;
  onClose: () => void;
  wishlists: Wishlist[];
  /** Already-selected list ids (usually empty when unlisted) */
  selectedIds?: string[];
  onConfirm: (wishlistIds: string[]) => void;
};

function portalTarget(): HTMLElement {
  return document.querySelector<HTMLElement>(".phone-frame") ?? document.body;
}

export default function AddToWishlistModal({
  open,
  onClose,
  wishlists,
  selectedIds = [],
  onConfirm,
}: Props) {
  const titleId = useId();
  const [picked, setPicked] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (!open) return;
    setPicked(selectedIds);
  }, [open, selectedIds]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  function toggle(id: string) {
    setPicked((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  return createPortal(
    <div className="fav-search-root" role="presentation">
      <button type="button" className="fav-search-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="fav-search-modal add-to-list-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="fav-search-header">
          <h2 id={titleId} className="fav-search-title">
            Add to wishlist
          </h2>
          <button type="button" className="fav-search-close" aria-label="Close" onClick={onClose}>
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        {wishlists.length === 0 ? (
          <p className="fav-search-empty muted">No wishlists yet — create one from Home.</p>
        ) : (
          <ul className="add-to-list-options">
            {wishlists.map((w) => (
              <li key={w.id}>
                <label className="check-row add-to-list-row">
                  <input
                    type="checkbox"
                    checked={picked.includes(w.id)}
                    onChange={() => toggle(w.id)}
                  />
                  <span className="add-to-list-row-text">
                    <span className="fav-search-result-title">{w.title}</span>
                    <span className="fav-search-result-meta">
                      {w.items.length} wish{w.items.length === 1 ? "" : "es"}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="btn btn-block"
          disabled={picked.length === 0 || wishlists.length === 0}
          onClick={() => {
            onConfirm(picked);
            onClose();
          }}
        >
          Add to {picked.length || ""} wishlist{picked.length === 1 ? "" : "s"}
        </button>
      </div>
    </div>,
    portalTarget(),
  );
}
