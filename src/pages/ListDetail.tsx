import { Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Wishlist } from "../api";
import AddCard from "../components/AddCard";
import MediaCard from "../components/MediaCard";
import MoreMenu from "../components/MoreMenu";
import Screen from "../components/Screen";
import { DetailSkeleton } from "../components/Skeleton";
import { isFavorite, toggleFavorite } from "../lib/favorites";

export default function ListDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [favTick, setFavTick] = useState(0);

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

  async function onDeleteItem(itemId: string, name: string) {
    if (!confirm(`Delete “${name}”?`)) return;
    try {
      await api.deleteWish(itemId);
      const res = await api.getWishlist(id);
      setWishlist(res.wishlist);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  }

  async function onDeleteList(title: string) {
    if (!confirm(`Delete “${title}”? Wishes on it stay in Unlisted wishes.`)) return;
    try {
      await api.deleteWishlist(id);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  }

  if (loading) {
    return (
      <Screen title="Wishlist" backTo="/app" backLabel="Home" tabs largeTitle={false}>
        <DetailSkeleton label="Loading wishlist" />
      </Screen>
    );
  }

  if (!wishlist) {
    return (
      <Screen title="Wishlist" backTo="/app" backLabel="Home" tabs largeTitle={false}>
        <p className="error">{error || "Not found"}</p>
      </Screen>
    );
  }

  void favTick;
  const favorited = isFavorite(id);
  const addWishPath = `/app/wishes/new?wishlist=${encodeURIComponent(id)}`;

  return (
    <Screen
      title={wishlist.title}
      backTo="/app"
      backLabel="Home"
      tabs
      largeTitle
      right={
        <MoreMenu
          aria-label={`Actions for ${wishlist.title}`}
          editLabel="Edit wishlist"
          deleteLabel="Delete wishlist"
          onEdit={() => navigate(`/app/lists/${id}/edit`)}
          onDelete={() => void onDeleteList(wishlist.title)}
          extra={{
            label: favorited ? "Unfavorite wishlist" : "Favorite wishlist",
            onSelect: () => {
              toggleFavorite(id);
              setFavTick((n) => n + 1);
            },
          }}
        />
      }
    >
      {wishlist.description ? (
        <p className="muted lead lead-center">{wishlist.description}</p>
      ) : null}

      <div className="action-strip action-strip-center">
        <Link className="btn btn-ghost btn-small" to={`/app/lists/${id}/share`}>
          <Share2 size={16} strokeWidth={2} aria-hidden="true" />
          Share
        </Link>
      </div>

      {error && <p className="error">{error}</p>}

      <ul className="card-grid">
        {wishlist.items.map((it) => (
          <li key={it.id}>
            <MediaCard
              to={`/app/lists/${id}/items/${it.id}`}
              title={it.name}
              variant="item"
              meta={
                [it.price, it.claimed ? `Claimed · ${it.claimedBy || "Anonymous"}` : null]
                  .filter(Boolean)
                  .join(" · ") || undefined
              }
              menu={{
                "aria-label": `Actions for ${it.name}`,
                editLabel: "Edit wish",
                deleteLabel: "Delete wish",
                onEdit: () => navigate(`/app/lists/${id}/items/${it.id}`),
                onDelete: () => void onDeleteItem(it.id, it.name),
              }}
            />
          </li>
        ))}
        <li>
          <AddCard to={addWishPath} label="Add wish" />
        </li>
      </ul>
    </Screen>
  );
}
