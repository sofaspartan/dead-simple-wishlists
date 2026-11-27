import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Wishlist } from "../api";
import MediaCard from "../components/MediaCard";
import Screen from "../components/Screen";
import { getFavoriteIds, toggleFavorite } from "../lib/favorites";

export default function Favorites() {
  const navigate = useNavigate();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [favIds, setFavIds] = useState<string[]>(() => getFavoriteIds());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
    if (!confirm(`Delete “${title}”?`)) return;
    try {
      await api.deleteWishlist(id);
      setWishlists((list) => list.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  }

  return (
    <Screen title="Favorites" tabs largeTitle>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : favorites.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">
            <Heart size={36} strokeWidth={1.5} />
          </span>
          <p className="empty-title">No favorites yet</p>
          <p className="muted">Star a wishlist from its ⋯ menu to find it here.</p>
          <Link className="btn" to="/app">
            Browse wishlists
          </Link>
        </div>
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
                  onEdit: () => navigate(`/app/lists/${w.id}/edit`),
                  onDelete: () => void onDeleteList(w.id, w.title),
                  extra: {
                    label: "Unfavorite",
                    onSelect: () => {
                      toggleFavorite(w.id);
                      setFavIds(getFavoriteIds());
                    },
                  },
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
