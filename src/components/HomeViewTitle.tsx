import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type HomeView = "wishlists" | "all" | "unlisted";

const OPTIONS: { id: HomeView; label: string }[] = [
  { id: "wishlists", label: "Wishlists" },
  { id: "all", label: "All wishes" },
  { id: "unlisted", label: "Unlisted wishes" },
];

type Props = {
  value: HomeView;
  onChange: (view: HomeView) => void;
};

function portalTarget(): HTMLElement {
  return document.querySelector<HTMLElement>(".phone-frame") ?? document.body;
}

export default function HomeViewTitle({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.id === value) || OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    sheetRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [open]);

  const sheet =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="home-view-root" role="presentation">
            <button
              type="button"
              className="home-view-backdrop"
              aria-label="Close"
              onClick={() => setOpen(false)}
            />
            <div
              className="home-view-sheet"
              role="menu"
              aria-label="Home view"
              id={menuId}
              ref={sheetRef}
            >
              {OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={opt.id === value}
                  className={`home-view-option${opt.id === value ? " active" : ""}`}
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {opt.id === value ? (
                    <Check size={18} strokeWidth={2.25} aria-hidden="true" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>,
          portalTarget(),
        )
      : null;

  return (
    <>
      <button
        type="button"
        className="home-view-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="screen-title home-view-label">{current.label}</span>
        <ChevronDown
          className={`home-view-caret${open ? " open" : ""}`}
          size={22}
          strokeWidth={2.25}
          aria-hidden="true"
        />
      </button>
      {sheet}
    </>
  );
}
