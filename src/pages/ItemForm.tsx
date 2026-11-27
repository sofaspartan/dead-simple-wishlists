import { Plus, Save, Trash2, Undo2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, type Wishlist } from "../api";
import Screen from "../components/Screen";
import { FormSkeleton } from "../components/Skeleton";

const empty = { name: "", url: "", notes: "", price: "" };

export default function ItemForm() {
  const { id: routeListId = "", itemId: routeItemId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Wish-centric: /app/wishes/new | /app/wishes/:itemId
  // List-centric: /app/lists/:id/items/new | /app/lists/:id/items/:itemId
  const onWishRoute = !routeListId;
  const rawId = onWishRoute ? routeItemId : routeItemId;
  const isNew = !rawId || rawId === "new";
  const itemId = isNew ? undefined : rawId;

  const prefListId = routeListId || searchParams.get("wishlist") || "";
  const preferUnlisted = searchParams.get("unlisted") === "1";

  const [item, setItem] = useState(empty);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [createMode, setCreateMode] = useState<"lists" | "unlisted" | "new">("lists");
  const [newWishlistTitle, setNewWishlistTitle] = useState("");
  const [claimed, setClaimed] = useState(false);
  const [claimedBy, setClaimedBy] = useState<string | null>(null);
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

        if (isNew) {
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
        } else if (itemId) {
          let found;
          if (onWishRoute) {
            const res = await api.getWish(itemId);
            found = res.wish;
          } else {
            const res = await api.getWishlist(routeListId);
            found = res.wishlist.items.find((i) => i.id === itemId);
          }
          if (!found) {
            setError("Wish not found");
            return;
          }
          setItem({
            name: found.name,
            url: found.url,
            notes: found.notes,
            price: found.price,
          });
          setSelectedListIds(found.wishlistIds || (routeListId ? [routeListId] : []));
          setClaimed(found.claimed);
          setClaimedBy(found.claimedBy);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [isNew, routeListId, itemId, prefListId, preferUnlisted, onWishRoute]);

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
      if (isNew) {
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
      } else if (itemId) {
        await api.updateWish(itemId, { ...item, wishlistIds: selectedListIds });
        if (routeListId) {
          navigate(`/app/lists/${routeListId}`, { replace: true });
        } else {
          navigate("/app", { replace: true });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!itemId || isNew) return;
    if (!confirm("Delete this wish?")) return;
    await api.deleteWish(itemId);
    navigate(backTo, { replace: true });
  }

  async function onUnclaim() {
    if (!itemId || isNew) return;
    setBusy(true);
    try {
      const res = await api.unclaimWish(itemId);
      setClaimed(Boolean(res.wish.claimed));
      setClaimedBy(res.wish.claimedBy ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unclaim");
    } finally {
      setBusy(false);
    }
  }

  const title = isNew ? "Add wish" : "Edit wish";
  const canSubmit = item.name.trim().length > 0;

  if (loading) {
    return (
      <Screen title={title} backTo={backTo} backLabel="Back" largeTitle={false}>
        <FormSkeleton count={isNew ? 4 : 3} label="Loading wish" />
      </Screen>
    );
  }

  return (
    <Screen title={title} backTo={backTo} backLabel="Back" largeTitle>
      {!isNew && claimed ? (
        <div className="banner banner-claimed">
          Claimed by {claimedBy || "Anonymous"}
          <button className="text-action" type="button" onClick={() => void onUnclaim()}>
            <Undo2 size={16} strokeWidth={2} aria-hidden="true" />
            Unclaim
          </button>
        </div>
      ) : null}

      <form className="form-grid" onSubmit={onSubmit}>
        {isNew ? (
          <>
            <fieldset className="wish-list-fieldset">
              <legend>Add to</legend>
              <label className="check-row">
                <input
                  type="radio"
                  name="create-mode"
                  checked={createMode === "unlisted"}
                  onChange={() => setCreateMode("unlisted")}
                />
                Unlisted (no wishlist)
              </label>
              <label className="check-row">
                <input
                  type="radio"
                  name="create-mode"
                  checked={createMode === "lists"}
                  onChange={() => setCreateMode("lists")}
                  disabled={wishlists.length === 0}
                />
                Existing wishlist(s)
              </label>
              <label className="check-row">
                <input
                  type="radio"
                  name="create-mode"
                  checked={createMode === "new"}
                  onChange={() => setCreateMode("new")}
                />
                New wishlist…
              </label>
            </fieldset>

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
          </>
        ) : (
          <fieldset className="wish-list-fieldset">
            <legend>Wishlists</legend>
            <p className="muted" style={{ margin: "0 0 0.35rem", fontWeight: 400 }}>
              A wish can belong to multiple wishlists, or none (unlisted).
            </p>
            {wishlists.length === 0 ? (
              <p className="muted" style={{ margin: 0, fontWeight: 400 }}>
                No wishlists yet — save to keep this wish unlisted.
              </p>
            ) : (
              wishlists.map((w) => (
                <label key={w.id} className="check-row">
                  <input
                    type="checkbox"
                    checked={selectedListIds.includes(w.id)}
                    onChange={() => toggleList(w.id)}
                  />
                  {w.title}
                </label>
              ))
            )}
          </fieldset>
        )}

        <label>
          Name
          <input
            value={item.name}
            onChange={(e) => setItem((s) => ({ ...s, name: e.target.value }))}
            required
            autoFocus={isNew}
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
          {isNew ? (
            <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
          ) : (
            <Save size={18} strokeWidth={2} aria-hidden="true" />
          )}
          {busy ? "Saving…" : isNew ? "Add wish" : "Save"}
        </button>
      </form>

      {!isNew ? (
        <button
          className="btn btn-danger btn-block"
          type="button"
          onClick={() => void onDelete()}
        >
          <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
          Delete wish
        </button>
      ) : null}
    </Screen>
  );
}
