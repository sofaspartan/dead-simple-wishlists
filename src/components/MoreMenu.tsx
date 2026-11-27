import { Ellipsis, Heart, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type MoreMenuAction = {
  label: string;
  onSelect: () => void;
  icon?: LucideIcon;
  danger?: boolean;
};

export type MoreMenuExtra = MoreMenuAction;

export type MoreMenuProps = {
  "aria-label"?: string;
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
  /** Optional third action (e.g. Favorite) — prefer `extras` for multiple */
  extra?: MoreMenuAction;
  /** Actions between Edit and Delete */
  extras?: MoreMenuAction[];
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
  extras,
}: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const middleActions = extras?.length ? extras : extra ? [extra] : [];

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
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
            <div className="more-menu-sheet" id={menuId} role="menu" aria-label={ariaLabel}>
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
              {middleActions.map((action) => {
                const Icon = action.icon || Heart;
                return (
                  <button
                    key={action.label}
                    type="button"
                    className={`more-menu-item${action.danger ? " more-menu-item-danger" : ""}`}
                    role="menuitem"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      close();
                      action.onSelect();
                    }}
                  >
                    <Icon {...iconProps} />
                    {action.label}
                  </button>
                );
              })}
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
