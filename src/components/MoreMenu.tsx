import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

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
  const [openUp, setOpenUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
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

  useLayoutEffect(() => {
    if (!open) {
      setOpenUp(false);
      return;
    }
    const trigger = rootRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const triggerRect = trigger.getBoundingClientRect();
    const panelHeight = panel.offsetHeight;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    setOpenUp(spaceBelow < panelHeight + 12 && spaceAbove > spaceBelow);
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
        <div
          className={`more-menu-panel${openUp ? " open-up" : ""}`}
          id={menuId}
          role="menu"
          ref={panelRef}
        >
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
