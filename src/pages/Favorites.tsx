import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Wishlist } from "../api";
import AddCard from "../components/AddCard";
import FavoriteSearchModal from "../components/FavoriteSearchModal";
import MediaCard from "../components/MediaCard";
import Screen from "../components/Screen";
import { CardGridSkeleton } from "../components/Skeleton";
import { getFavoriteIds, toggleFavorite } from "../lib/favorites";

export default function Favorites() {
  const navigate = useNavigate();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [favIds, setFavIds] = useState<string[]>(() => getFavoriteIds());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await api.listWishlists();
        setWishlists(res.wishlists);
        setFavIds(getFavoriteIds());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const favorites = wishlists.filter((w) => favIds.includes(w.id));

  async function onDeleteList(id: string, title: string) {
    if (!confirm(`Delete “${title}”? Wishes on it stay in Unlisted wishes.`)) return;
    try {
      await api.deleteWishlist(id);
      setWishlists((list) => list.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  }

  function onAddFavorite(id: string) {
    if (!favIds.includes(id)) {
      toggleFavorite(id);
      setFavIds(getFavoriteIds());
    }
  }

  return (
    <Screen title="Favorites" tabs largeTitle>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <CardGridSkeleton label="Loading favorites" />
      ) : (
        <ul className="card-grid">
          {favorites.map((w) => (
            <li key={w.id}>
              <MediaCard
                to={`/app/lists/${w.id}`}
                title={w.title}
                variant="list"
                owner={w.owner}
                meta={`${w.items.length} wish${w.items.length === 1 ? "" : "es"}`}
                menu={{
                  "aria-label": `Actions for ${w.title}`,
                  editLabel: "Edit wishlist",
                  deleteLabel: "Delete wishlist",
                  onEdit: () => navigate(`/app/lists/${w.id}/edit`),
                  onDelete: () => void onDeleteList(w.id, w.title),
                  extra: {
                    label: "Unfavorite wishlist",
                    onSelect: () => {
                      toggleFavorite(w.id);
                      setFavIds(getFavoriteIds());
                    },
                  },
                }}
              />
            </li>
          ))}
          <li>
            <AddCard label="Add to favorites" onClick={() => setPickerOpen(true)} />
          </li>
        </ul>
      )}

      <FavoriteSearchModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        wishlists={wishlists}
        favoritedIds={favIds}
        onPick={onAddFavorite}
      />
    </Screen>
  );
}
