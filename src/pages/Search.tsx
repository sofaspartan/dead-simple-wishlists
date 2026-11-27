import { Search as SearchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Wishlist } from "../api";
import MediaCard from "../components/MediaCard";
import Screen from "../components/Screen";
import { isFavorite, toggleFavorite } from "../lib/favorites";

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wishlists;
    return wishlists.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.items.some((i) => i.name.toLowerCase().includes(q))
    );
  }, [wishlists, query]);

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
    <Screen title="Search" tabs largeTitle>
      <label className="search-field">
        <span className="search-field-icon" aria-hidden="true">
          <SearchIcon size={20} strokeWidth={1.75} />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Wishlists or wishes"
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">{query.trim() ? "No matches" : "Nothing to search"}</p>
          <p className="muted">
            {query.trim() ? "Try a different name." : "Create a wishlist to find it here."}
          </p>
        </div>
      ) : (
        <ul className="card-grid">
          {filtered.map((w) => {
            void favTick;
            const favorited = isFavorite(w.id);
            return (
              <li key={w.id}>
                <MediaCard
                  to={`/app/lists/${w.id}`}
                  title={w.title}
                  variant="list"
                  meta={`${w.items.length} wish${w.items.length === 1 ? "" : "es"}`}
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
        </ul>
      )}
    </Screen>
  );
}
