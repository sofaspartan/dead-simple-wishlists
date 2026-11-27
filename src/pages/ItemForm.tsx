import { Plus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, type Wishlist } from "../api";
import Screen from "../components/Screen";
import { FormSkeleton } from "../components/Skeleton";

const empty = { name: "", url: "", notes: "", price: "" };

export default function ItemForm() {
  const { id: routeListId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const prefListId = routeListId || searchParams.get("wishlist") || "";
  const preferUnlisted = searchParams.get("unlisted") === "1";

  const [item, setItem] = useState(empty);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [createMode, setCreateMode] = useState<"lists" | "unlisted" | "new">("lists");
  const [newWishlistTitle, setNewWishlistTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const backTo = useMemo(() => {
    if (routeListId) return `/app/lists/${routeListId}`;
    if (prefListId) return `/app/lists/${prefListId}`;
    return "/app";
  }, [routeListId, prefListId]);

  useEffect(() => {
    void (async () => {
      try {
        const lists = await api.listWishlists();
        setWishlists(lists.wishlists);

        if (preferUnlisted) {
          setCreateMode("unlisted");
          setSelectedListIds([]);
        } else if (prefListId && lists.wishlists.some((w) => w.id === prefListId)) {
          setCreateMode("lists");
          setSelectedListIds([prefListId]);
        } else if (lists.wishlists.length > 0) {
          setCreateMode("lists");
          setSelectedListIds([lists.wishlists[0].id]);
        } else {
          setCreateMode("new");
          setSelectedListIds([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [prefListId, preferUnlisted]);

  function toggleList(id: string) {
    setSelectedListIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      let wishlistIds: string[] = [];
      if (createMode === "new") {
        const title = newWishlistTitle.trim() || item.name.trim() || "Wishlist";
        const created = await api.createWishlist(title);
        wishlistIds = [created.wishlist.id];
      } else if (createMode === "lists") {
        wishlistIds = selectedListIds;
      }
      const created = await api.createWish({ ...item, wishlistIds });
      if (wishlistIds.length === 1) {
        navigate(`/app/lists/${wishlistIds[0]}`, { replace: true });
      } else {
        navigate(`/app/wishes/${created.wish.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setBusy(false);
    }
  }

  const canSubmit = item.name.trim().length > 0;

  if (loading) {
    return (
      <Screen title="Add wish" backTo={backTo} backLabel="Back" largeTitle={false}>
        <FormSkeleton count={4} label="Loading wish" />
      </Screen>
    );
  }

  return (
    <Screen title="Add wish" backTo={backTo} backLabel="Back" largeTitle>
      <form className="form-grid" onSubmit={onSubmit}>
        <div className="create-mode-tabs" role="tablist" aria-label="Add to">
          <button
            type="button"
            role="tab"
            aria-selected={createMode === "unlisted"}
            className={`create-mode-tab${createMode === "unlisted" ? " active" : ""}`}
            onClick={() => setCreateMode("unlisted")}
          >
            Unlisted
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={createMode === "lists"}
            className={`create-mode-tab${createMode === "lists" ? " active" : ""}`}
            onClick={() => setCreateMode("lists")}
            disabled={wishlists.length === 0}
          >
            Wishlist
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={createMode === "new"}
            className={`create-mode-tab${createMode === "new" ? " active" : ""}`}
            onClick={() => setCreateMode("new")}
          >
            New list
          </button>
        </div>

        {createMode === "lists" ? (
          <fieldset className="wish-list-fieldset">
            <legend>Wishlists</legend>
            {wishlists.map((w) => (
              <label key={w.id} className="check-row">
                <input
                  type="checkbox"
                  checked={selectedListIds.includes(w.id)}
                  onChange={() => toggleList(w.id)}
                />
                {w.title}
              </label>
            ))}
          </fieldset>
        ) : null}

        {createMode === "new" ? (
          <label>
            New wishlist name
            <input
              value={newWishlistTitle}
              onChange={(e) => setNewWishlistTitle(e.target.value)}
              placeholder="Birthday, holidays…"
            />
          </label>
        ) : null}

        <label>
          Name
          <input
            value={item.name}
            onChange={(e) => setItem((s) => ({ ...s, name: e.target.value }))}
            required
            autoFocus
          />
        </label>
        <label>
          URL
          <input
            value={item.url}
            onChange={(e) => setItem((s) => ({ ...s, url: e.target.value }))}
            placeholder="https://"
            inputMode="url"
          />
        </label>
        <label>
          Price
          <input
            value={item.price}
            onChange={(e) => setItem((s) => ({ ...s, price: e.target.value }))}
            placeholder="optional"
          />
        </label>
        <label>
          Notes
          <textarea
            rows={3}
            value={item.notes}
            onChange={(e) => setItem((s) => ({ ...s, notes: e.target.value }))}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-block" type="submit" disabled={busy || !canSubmit}>
          <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
          {busy ? "Saving…" : "Add wish"}
        </button>
      </form>
    </Screen>
  );
}
