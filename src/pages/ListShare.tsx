import { Check, Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import Screen from "../components/Screen";

export default function ListShare() {
  const { id = "" } = useParams();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const shareUrl =
    typeof window !== "undefined" && slug
      ? `${window.location.origin}/w/${slug}`
      : "";

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.getWishlist(id);
        setSlug(res.wishlist.shareSlug);
        setTitle(res.wishlist.title);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <Screen title="Share" backTo={`/app/lists/${id}`} backLabel="List" largeTitle={false}>
        <p className="muted">Loading…</p>
      </Screen>
    );
  }

  return (
    <Screen title="Share" backTo={`/app/lists/${id}`} backLabel="List" largeTitle>
      <p className="muted lead">
        Anyone with this link can view <strong>{title}</strong> and claim items.
      </p>
      {error && <p className="error">{error}</p>}
      <div className="share-url">{shareUrl}</div>
      <button
        className="btn btn-block"
        type="button"
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
      <Link className="btn btn-ghost btn-block" to={`/w/${slug}`} target="_blank">
        <ExternalLink size={18} strokeWidth={2} aria-hidden="true" />
        Open public page
      </Link>
    </Screen>
  );
}
