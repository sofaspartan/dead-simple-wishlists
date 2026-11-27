import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, type Wishlist } from "../api";
import AddCard from "../components/AddCard";
import EditWishModal from "../components/EditWishModal";
import EditWishlistModal from "../components/EditWishlistModal";
import MediaCard from "../components/MediaCard";
import Screen from "../components/Screen";
import ShareModal from "../components/ShareModal";
import { DetailSkeleton } from "../components/Skeleton";
import WishlistHeaderCard from "../components/WishlistHeaderCard";
import { isFavorite, toggleFavorite } from "../lib/favorites";

export default function ListDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [favTick, setFavTick] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [editListOpen, setEditListOpen] = useState(false);
  const [editWishId, setEditWishId] = useState<string | null>(null);

  async function reload() {
    const res = await api.getWishlist(id);
    setWishlist(res.wishlist);
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on id change only
  }, [id]);

  async function onDeleteItem(itemId: string, name: string) {
    if (!confirm(`Delete “${name}”?`)) return;
    try {
      await api.deleteWish(itemId);
      await reload();
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
      <Screen backTo="/app" backLabel="Home" tabs largeTitle={false}>
        <DetailSkeleton label="Loading wishlist" />
      </Screen>
    );
  }

  if (!wishlist) {
    return (
      <Screen backTo="/app" backLabel="Home" tabs largeTitle={false}>
        <p className="error">{error || "Not found"}</p>
      </Screen>
    );
  }

  void favTick;
  const favorited = isFavorite(id);
  const addWishPath = `/app/wishes/new?wishlist=${encodeURIComponent(id)}`;

  return (
    <Screen backTo="/app" backLabel="Home" tabs largeTitle={false}>
      <WishlistHeaderCard
        title={wishlist.title}
        createdAt={wishlist.createdAt}
        owner={wishlist.owner}
        description={wishlist.description}
        onShare={() => setShareOpen(true)}
        menu={{
          "aria-label": `Actions for ${wishlist.title}`,
          editLabel: "Edit wishlist",
          deleteLabel: "Delete wishlist",
          onEdit: () => setEditListOpen(true),
          onDelete: () => void onDeleteList(wishlist.title),
          extra: {
            label: favorited ? "Unfavorite wishlist" : "Favorite wishlist",
            onSelect: () => {
              toggleFavorite(id);
              setFavTick((n) => n + 1);
            },
          },
        }}
      />

      {error && <p className="error">{error}</p>}

      <ul className="card-grid">
        {wishlist.items.map((it) => (
          <li key={it.id}>
            <MediaCard
              to={`/app/wishes/${it.id}?list=${encodeURIComponent(id)}`}
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
                onEdit: () => setEditWishId(it.id),
                onDelete: () => void onDeleteItem(it.id, it.name),
              }}
            />
          </li>
        ))}
        <li>
          <AddCard to={addWishPath} label="Add wish" />
        </li>
      </ul>

      <ShareModal open={shareOpen} wishlistId={id} onClose={() => setShareOpen(false)} />

      <EditWishlistModal
        open={editListOpen}
        wishlistId={id}
        onClose={() => setEditListOpen(false)}
        onSaved={() => {
          void reload().catch((err) => {
            setError(err instanceof Error ? err.message : "Failed to reload");
          });
        }}
        onDeleted={() => navigate("/app", { replace: true })}
      />

      <EditWishModal
        open={Boolean(editWishId)}
        wishId={editWishId}
        onClose={() => setEditWishId(null)}
        onSaved={() => {
          void reload().catch((err) => {
            setError(err instanceof Error ? err.message : "Failed to reload");
          });
        }}
        onDeleted={() => {
          void reload().catch((err) => {
            setError(err instanceof Error ? err.message : "Failed to reload");
          });
        }}
      />
    </Screen>
  );
}
