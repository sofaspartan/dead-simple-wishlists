import { ChevronRight, Pencil, Plus, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Wishlist } from "../api";
import Screen from "../components/Screen";

export default function ListDetail() {
  const { id = "" } = useParams();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await api.getWishlist(id);
        setWishlist(res.wishlist);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <Screen title="List" backTo="/app" backLabel="Lists" largeTitle={false}>
        <p className="muted">Loading…</p>
      </Screen>
    );
  }

  if (!wishlist) {
    return (
      <Screen title="List" backTo="/app" backLabel="Lists" largeTitle={false}>
        <p className="error">{error || "Not found"}</p>
      </Screen>
    );
  }

  return (
    <Screen
      title={wishlist.title}
      backTo="/app"
      backLabel="Lists"
      largeTitle
      right={
        <Link to={`/app/lists/${id}/edit`} className="text-action">
          <Pencil size={16} strokeWidth={2} aria-hidden="true" />
          Edit
        </Link>
      }
    >
      {wishlist.description ? (
        <p className="muted lead">{wishlist.description}</p>
      ) : null}

      <div className="action-strip">
        <Link className="btn btn-ghost btn-small" to={`/app/lists/${id}/share`}>
          <Share2 size={16} strokeWidth={2} aria-hidden="true" />
          Share
        </Link>
        <Link className="btn btn-small" to={`/app/lists/${id}/items/new`}>
          <Plus size={16} strokeWidth={2.25} aria-hidden="true" />
          Add item
        </Link>
      </div>

      {error && <p className="error">{error}</p>}

      {wishlist.items.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">No items</p>
          <p className="muted">Add gifts your friends can claim.</p>
          <Link className="btn" to={`/app/lists/${id}/items/new`}>
            <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
            Add first item
          </Link>
        </div>
      ) : (
        <ul className="nav-list">
          {wishlist.items.map((it) => (
            <li key={it.id}>
              <Link className="nav-row" to={`/app/lists/${id}/items/${it.id}`}>
                <div>
                  <span className="nav-row-title">{it.name}</span>
                  <span className="nav-row-meta">
                    {[it.price, it.claimed ? `Claimed · ${it.claimedBy || "Anonymous"}` : null]
                      .filter(Boolean)
                      .join(" · ") || "Tap to edit"}
                  </span>
                </div>
                <span className="chevron" aria-hidden="true">
                  <ChevronRight size={20} strokeWidth={1.75} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
