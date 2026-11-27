import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Wishlist } from "../api";
import AddCard from "../components/AddCard";
import MediaCard from "../components/MediaCard";
import Screen from "../components/Screen";
import { isFavorite, toggleFavorite } from "../lib/favorites";

export default function ListsHome() {
  const navigate = useNavigate();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [favTick, setFavTick] = useState(0);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await api.listWishlists();
        setWishlists(res.wishlists);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    <Screen title="Wishlists" tabs largeTitle>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <ul className="card-grid">
          {wishlists.map((w) => {
            void favTick;
            const favorited = isFavorite(w.id);
            return (
              <li key={w.id}>
                <MediaCard
                  to={`/app/lists/${w.id}`}
                  title={w.title}
                  variant="list"
                  owner={w.owner}
                  meta={
                    [
                      `${w.items.length} wish${w.items.length === 1 ? "" : "es"}`,
                      w.items.some((i) => i.claimed)
                        ? `${w.items.filter((i) => i.claimed).length} claimed`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  }
                  menu={{
                    "aria-label": `Actions for ${w.title}`,
                    onEdit: () => navigate(`/app/lists/${w.id}/edit`),
                    onDelete: () => void onDeleteList(w.id, w.title),
                    extra: {
                      label: favorited ? "Unfavorite" : "Favorite",
                      onSelect: () => {
                        toggleFavorite(w.id);
                        setFavTick((n) => n + 1);
                      },
                    },
                  }}
                />
              </li>
            );
          })}
          <li>
            <AddCard to="/app/new" label="Add wishlist" />
          </li>
        </ul>
      )}
    </Screen>
  );
}
