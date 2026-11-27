import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Wishlist, type WishlistItem } from "../api";
import AddCard from "../components/AddCard";
import HomeViewTitle, { type HomeView } from "../components/HomeViewTitle";
import MediaCard from "../components/MediaCard";
import Screen from "../components/Screen";
import { CardGridSkeleton } from "../components/Skeleton";
import { isFavorite, toggleFavorite } from "../lib/favorites";

const VIEW_KEY = "wish-home-view";

function readView(): HomeView {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "wishlists" || v === "all" || v === "unlisted") return v;
  } catch {
    /* ignore */
  }
  return "wishlists";
}

export default function ListsHome() {
  const navigate = useNavigate();
  const [view, setView] = useState<HomeView>(() => readView());
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [wishes, setWishes] = useState<WishlistItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [favTick, setFavTick] = useState(0);

  function changeView(next: HomeView) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      try {
        if (view === "wishlists") {
          const res = await api.listWishlists();
          setWishlists(res.wishlists);
        } else {
          const res = await api.listWishes(view === "unlisted" ? "unlisted" : "all");
          setWishes(res.wishes);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [view]);

  async function onDeleteList(id: string, title: string) {
    if (!confirm(`Delete “${title}”? Wishes on it stay in Unlisted wishes.`)) return;
    try {
      await api.deleteWishlist(id);
      setWishlists((list) => list.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  }

  async function onDeleteWish(id: string, name: string) {
    if (!confirm(`Delete “${name}”?`)) return;
    try {
      await api.deleteWish(id);
      setWishes((list) => list.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  }

  function wishlistTitles(ids: string[] = []) {
    if (!ids.length) return "Unlisted";
    const titles = ids
      .map((id) => wishlists.find((w) => w.id === id)?.title)
      .filter(Boolean);
    return titles.length ? titles.join(", ") : `${ids.length} wishlist${ids.length === 1 ? "" : "s"}`;
  }

  // Load wishlist titles for wish meta when in wish views
  useEffect(() => {
    if (view === "wishlists") return;
    void (async () => {
      try {
        const res = await api.listWishlists();
        setWishlists(res.wishlists);
      } catch {
        /* meta only */
      }
    })();
  }, [view]);

  return (
    <Screen title={<HomeViewTitle value={view} onChange={changeView} />} tabs largeTitle>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <CardGridSkeleton
          label={view === "wishlists" ? "Loading wishlists" : "Loading wishes"}
        />
      ) : view === "wishlists" ? (
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
                    editLabel: "Edit wishlist",
                    deleteLabel: "Delete wishlist",
                    onEdit: () => navigate(`/app/lists/${w.id}/edit`),
                    onDelete: () => void onDeleteList(w.id, w.title),
                    extra: {
                      label: favorited ? "Unfavorite wishlist" : "Favorite wishlist",
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
      ) : (
        <ul className="card-grid">
          {wishes.map((w) => (
            <li key={w.id}>
              <MediaCard
                to={`/app/wishes/${w.id}`}
                title={w.name}
                variant="item"
                meta={
                  [
                    wishlistTitles(w.wishlistIds),
                    w.price || null,
                    w.claimed ? `Claimed · ${w.claimedBy || "Anonymous"}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || undefined
                }
                menu={{
                  "aria-label": `Actions for ${w.name}`,
                  editLabel: "Edit wish",
                  deleteLabel: "Delete wish",
                  onEdit: () => navigate(`/app/wishes/${w.id}`),
                  onDelete: () => void onDeleteWish(w.id, w.name),
                }}
              />
            </li>
          ))}
          <li>
            <AddCard
              to={view === "unlisted" ? "/app/wishes/new?unlisted=1" : "/app/wishes/new"}
              label="Add wish"
            />
          </li>
        </ul>
      )}
    </Screen>
  );
}
