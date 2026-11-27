import { Check, Copy, ExternalLink, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api";
import { ShareSkeleton } from "./Skeleton";

type Props = {
  open: boolean;
  wishlistId: string;
  onClose: () => void;
};

function portalTarget(): HTMLElement {
  return document.querySelector<HTMLElement>(".phone-frame") ?? document.body;
}

export default function ShareModal({ open, wishlistId, onClose }: Props) {
  const titleId = useId();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const shareUrl =
    typeof window !== "undefined" && slug ? `${window.location.origin}/w/${slug}` : "";

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);

    setLoading(true);
    setError("");
    setCopied(false);
    void (async () => {
      try {
        const res = await api.getWishlist(wishlistId);
        setSlug(res.wishlist.shareSlug);
        setTitle(res.wishlist.title);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();

    return () => document.removeEventListener("keydown", onKey);
  }, [open, wishlistId, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="app-modal-root" role="presentation">
      <button type="button" className="app-modal-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="app-modal-header">
          <h2 id={titleId} className="app-modal-title">
            Share
          </h2>
          <button type="button" className="app-modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <ShareSkeleton label="Loading share link" />
        ) : (
          <div className="app-modal-stack">
            <p className="muted lead">
              Anyone with this link can view <strong>{title}</strong> and claim wishes.
            </p>
            {error ? <p className="error">{error}</p> : null}
            {shareUrl ? <div className="share-url">{shareUrl}</div> : null}
            <button
              className="btn btn-block"
              type="button"
              disabled={!shareUrl}
              onClick={() => {
                void navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? (
                <>
                  <Check size={18} strokeWidth={2.25} aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={18} strokeWidth={2} aria-hidden="true" />
                  Copy link
                </>
              )}
            </button>
            {slug ? (
              <a className="btn btn-ghost btn-block" href={`/w/${slug}`} target="_blank" rel="noreferrer">
                <ExternalLink size={18} strokeWidth={2} aria-hidden="true" />
                Open public page
              </a>
            ) : null}
          </div>
        )}
      </div>
    </div>,
    portalTarget(),
  );
}
