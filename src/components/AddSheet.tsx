import { Gift, ListPlus, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  /** When set, “Add wish” pre-selects this wishlist. */
  listId?: string;
};

const iconProps = { size: 22, strokeWidth: 1.75, "aria-hidden": true as const };

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
    const first = panelRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)");
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
        <div className="add-sheet-header">
          <h2 id={titleId} className="add-sheet-title">
            Create
          </h2>
          <button type="button" className="add-sheet-close" aria-label="Close" onClick={onClose}>
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        <div className="add-sheet-actions">
          <button type="button" className="add-sheet-action" onClick={() => go(addWishPath)}>
            <span className="add-sheet-action-icon">
              <Gift {...iconProps} />
            </span>
            <span className="add-sheet-action-text">
              <span className="add-sheet-action-label">Add wish</span>
              <span className="add-sheet-action-hint">
                {listId ? "To this wishlist or another" : "Pick a wishlist or start a new one"}
              </span>
            </span>
          </button>
          <button type="button" className="add-sheet-action" onClick={() => go("/app/new")}>
            <span className="add-sheet-action-icon">
              <ListPlus {...iconProps} />
            </span>
            <span className="add-sheet-action-text">
              <span className="add-sheet-action-label">Add wishlist</span>
              <span className="add-sheet-action-hint">Start a new wishlist</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
