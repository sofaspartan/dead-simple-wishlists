import { Ellipsis, Heart, Pencil, Trash2 } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type MoreMenuExtra = {
  label: string;
  onSelect: () => void;
};

export type MoreMenuProps = {
  "aria-label"?: string;
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
  /** Optional third action (e.g. Favorite) */
  extra?: MoreMenuExtra;
};

type PanelCoords = {
  top: number;
  left: number;
  openUp: boolean;
};

export default function MoreMenu({
  "aria-label": ariaLabel = "More actions",
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
  extra,
}: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<PanelCoords | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
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
      setCoords(null);
      return;
    }

    function place() {
      const trigger = rootRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const rect = trigger.getBoundingClientRect();
      const panelHeight = panel.offsetHeight;
      const panelWidth = panel.offsetWidth;
      const gap = 2;
      const margin = 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUp = spaceBelow < panelHeight + 12 && spaceAbove > spaceBelow;

      let top = openUp ? rect.top - panelHeight + gap : rect.bottom - gap;
      let left = rect.right - panelWidth;

      left = Math.max(margin, Math.min(left, window.innerWidth - panelWidth - margin));
      if (openUp) {
        top = Math.max(margin, top);
      } else {
        top = Math.min(top, window.innerHeight - panelHeight - margin);
      }

      setCoords({ top, left, openUp });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, extra]);

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className={`more-menu-panel${coords?.openUp ? " open-up" : ""}`}
            id={menuId}
            role="menu"
            ref={panelRef}
            style={{
              top: coords?.top ?? 0,
              left: coords?.left ?? 0,
              visibility: coords ? "visible" : "hidden",
            }}
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
              <Pencil size={20} strokeWidth={2} aria-hidden="true" />
              {editLabel}
            </button>
            {extra ? (
              <button
                type="button"
                className="more-menu-item"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  extra.onSelect();
                }}
              >
                <Heart size={20} strokeWidth={2} aria-hidden="true" />
                {extra.label}
              </button>
            ) : null}
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
              <Trash2 size={20} strokeWidth={2} aria-hidden="true" />
              {deleteLabel}
            </button>
          </div>,
          document.body,
        )
      : null;

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
        <Ellipsis size={24} strokeWidth={2.25} aria-hidden="true" />
      </button>
      {panel}
    </div>
  );
}
