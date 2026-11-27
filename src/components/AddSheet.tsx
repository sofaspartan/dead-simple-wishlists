import { useEffect, useId, useRef } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  /** When set, “Add wish” pre-selects this wishlist. */
  listId?: string;
};

export default function AddSheet({ open, onClose, listId }: Props) {
  const navigate = useNavigate();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLButtonElement>("button");
    first?.focus();
  }, [open]);

  if (!open) return null;

  function go(path: string) {
    onClose();
    navigate(path);
  }

  const addWishPath = listId
    ? `/app/wishes/new?wishlist=${encodeURIComponent(listId)}`
    : "/app/wishes/new";

  return (
    <div className="add-sheet-root" role="presentation">
      <button type="button" className="add-sheet-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="add-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
      >
        <h2 id={titleId} className="sr-only">
          Create
        </h2>
        <div className="add-sheet-actions">
          <button type="button" className="add-sheet-action" onClick={() => go(addWishPath)}>
            Add wish
          </button>
          <button type="button" className="add-sheet-action" onClick={() => go("/app/new")}>
            Add wishlist
          </button>
        </div>
      </div>
    </div>
  );
}
