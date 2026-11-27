import { Ellipsis, Heart, Pencil, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
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

const iconProps = {
  size: 20,
  strokeWidth: 2,
  "aria-hidden": true as const,
};

function portalTarget(): HTMLElement {
  return document.querySelector<HTMLElement>(".phone-frame") ?? document.body;
}

export default function MoreMenu({
  "aria-label": ariaLabel = "More actions",
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
  extra,
}: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const first = sheetRef.current?.querySelector<HTMLButtonElement>("button");
    first?.focus();
  }, [open]);

  function close() {
    setOpen(false);
  }

  const sheet =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="more-menu-root" role="presentation">
            <button
              type="button"
              className="more-menu-backdrop"
              aria-label="Close"
              onClick={close}
            />
            <div
              className="more-menu-sheet"
              id={menuId}
              role="menu"
              aria-label={ariaLabel}
              ref={sheetRef}
            >
              <button
                type="button"
                className="more-menu-item"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  close();
                  onEdit();
                }}
              >
                <Pencil {...iconProps} />
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
                    close();
                    extra.onSelect();
                  }}
                >
                  <Heart {...iconProps} />
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
                  close();
                  onDelete();
                }}
              >
                <Trash2 {...iconProps} />
                {deleteLabel}
              </button>
            </div>
          </div>,
          portalTarget(),
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
      {sheet}
    </div>
  );
}
