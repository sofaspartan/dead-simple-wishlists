import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type MoreMenuProps = {
  "aria-label"?: string;
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
};

export default function MoreMenu({
  "aria-label": ariaLabel = "More actions",
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
}: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="more-menu" ref={rootRef}>
      <button
        type="button"
        className="more-menu-trigger"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <EllipsisVertical size={20} strokeWidth={2} aria-hidden="true" />
      </button>
      {open ? (
        <div className="more-menu-panel" id={menuId} role="menu">
          <button
            type="button"
            className="more-menu-item"
            role="menuitem"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil size={16} strokeWidth={2} aria-hidden="true" />
            {editLabel}
          </button>
          <button
            type="button"
            className="more-menu-item more-menu-item-danger"
            role="menuitem"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
            {deleteLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
