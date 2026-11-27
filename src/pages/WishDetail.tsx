import { ExternalLink, FolderMinus, FolderPlus, Gift } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, type Wishlist, type WishlistItem } from "../api";
import AddToWishlistModal from "../components/AddToWishlistModal";
import MoreMenu from "../components/MoreMenu";
import Screen from "../components/Screen";
import { WishDetailSkeleton } from "../components/Skeleton";

type LocationState = {
  backTo?: string;
};

export default function WishDetail() {
  const { itemId = "", id: routeListId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) || null;

  const wishId = itemId;
  const fromListId = routeListId || searchParams.get("list") || "";

  const [wish, setWish] = useState<WishlistItem | null>(null);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const backTo = useMemo(() => {
    if (state?.backTo) return state.backTo;
    if (fromListId) return `/app/lists/${fromListId}`;
    return "/app";
  }, [state?.backTo, fromListId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const [wishRes, listsRes] = await Promise.all([
          api.getWish(wishId),
          api.listWishlists(),
        ]);
        setWish(wishRes.wish);
        setWishlists(listsRes.wishlists);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
        setWish(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [wishId]);

  const listIds = wish?.wishlistIds || [];
  const isUnlisted = listIds.length === 0;

  const listTitles = listIds
    .map((id) => wishlists.find((w) => w.id === id)?.title)
    .filter(Boolean) as string[];

  async function onDelete() {
    if (!wish) return;
    if (!confirm(`Delete “${wish.name}”?`)) return;
    try {
      await api.deleteWish(wish.id);
      navigate(backTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  }

  async function onRemoveFromWishlist() {
    if (!wish) return;
    const nextIds =
      fromListId && listIds.includes(fromListId)
        ? listIds.filter((id) => id !== fromListId)
        : [];
    const label =
      fromListId && listIds.includes(fromListId) && listIds.length > 1
        ? "Remove this wish from this wishlist?"
        : "Remove this wish from its wishlist(s)? It will become unlisted.";
    if (!confirm(label)) return;
    try {
      const res = await api.updateWish(wish.id, { wishlistIds: nextIds });
      setWish(res.wish);
      if (fromListId && !nextIds.includes(fromListId)) {
        navigate(`/app/lists/${fromListId}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update");
    }
  }

  async function onAddToWishlists(ids: string[]) {
    if (!wish) return;
    try {
      const res = await api.updateWish(wish.id, { wishlistIds: ids });
      setWish(res.wish);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update");
    }
  }

  if (loading) {
    return (
      <Screen backTo={backTo} backLabel="Back" tabs largeTitle={false}>
        <WishDetailSkeleton label="Loading wish" />
      </Screen>
    );
  }

  if (!wish) {
    return (
      <Screen backTo={backTo} backLabel="Back" tabs largeTitle={false}>
        <p className="error">{error || "Wish not found"}</p>
      </Screen>
    );
  }

  return (
    <Screen
      backTo={backTo}
      backLabel="Back"
      tabs
      largeTitle={false}
      right={
        <MoreMenu
          aria-label={`Actions for ${wish.name}`}
          editLabel="Edit wish"
          deleteLabel="Delete wish"
          onEdit={() => navigate(`/app/wishes/${wish.id}/edit`)}
          onDelete={() => void onDelete()}
          extras={
            isUnlisted
              ? [
                  {
                    label: "Add to wishlist",
                    icon: FolderPlus,
                    onSelect: () => setAddOpen(true),
                  },
                ]
              : [
                  {
                    label: "Remove from wishlist",
                    icon: FolderMinus,
                    onSelect: () => void onRemoveFromWishlist(),
                  },
                ]
          }
        />
      }
    >
      {error ? <p className="error">{error}</p> : null}

      <article className="wish-detail">
        <div className="wish-detail-hero" aria-hidden="true">
          <span className="wish-detail-placeholder">
            <Gift size={56} strokeWidth={1.5} />
          </span>
        </div>

        <div className="wish-detail-body">
          <h1 className="wish-detail-title">{wish.name}</h1>

          <p className="wish-detail-meta">
            {isUnlisted
              ? "Unlisted"
              : listTitles.length
                ? listTitles.join(" · ")
                : `${listIds.length} wishlist${listIds.length === 1 ? "" : "s"}`}
            {wish.price ? ` · ${wish.price}` : ""}
          </p>

          {wish.claimed ? (
            <div className="banner banner-claimed">
              Claimed by {wish.claimedBy || "Anonymous"}
            </div>
          ) : null}

          {wish.url ? (
            <a
              className="wish-detail-link"
              href={wish.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={18} strokeWidth={2} aria-hidden="true" />
              Open link
            </a>
          ) : null}

          {wish.notes ? <p className="wish-detail-notes">{wish.notes}</p> : null}
        </div>
      </article>

      <AddToWishlistModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        wishlists={wishlists}
        selectedIds={listIds}
        onConfirm={(ids) => void onAddToWishlists(ids)}
      />
    </Screen>
  );
}
