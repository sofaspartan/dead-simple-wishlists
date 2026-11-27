import { useEffect, useState } from "react";
import { api, type Wishlist, type WishlistItem } from "../api";
import AddCard from "../components/AddCard";
import EditWishModal from "../components/EditWishModal";
import EditWishlistModal from "../components/EditWishlistModal";
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
  const [view, setView] = useState<HomeView>(() => readView());
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [wishes, setWishes] = useState<WishlistItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [favTick, setFavTick] = useState(0);
  const [editListId, setEditListId] = useState<string | null>(null);
  const [editWishId, setEditWishId] = useState<string | null>(null);

  function changeView(next: HomeView) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* ignore */
    }
  }

  async function reload() {
    if (view === "wishlists") {
      const res = await api.listWishlists();
      setWishlists(res.wishlists);
    } else {
      const [wishesRes, listsRes] = await Promise.all([
        api.listWishes(view === "unlisted" ? "unlisted" : "all"),
        api.listWishlists(),
      ]);
      setWishes(wishesRes.wishes);
      setWishlists(listsRes.wishlists);
    }
  }

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      try {
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on view change only
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
                    onEdit: () => setEditListId(w.id),
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
                  onEdit: () => setEditWishId(w.id),
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

      <EditWishlistModal
        open={Boolean(editListId)}
        wishlistId={editListId}
        onClose={() => setEditListId(null)}
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
