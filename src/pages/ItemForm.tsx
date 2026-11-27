import { Plus, Save, Trash2, Undo2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, type Wishlist } from "../api";
import Screen from "../components/Screen";

const empty = { name: "", url: "", notes: "", price: "" };
const NEW_WISHLIST = "__new__";

export default function ItemForm() {
  const { id: routeListId = "", itemId } = useParams();
  const [searchParams] = useSearchParams();
  const isNew = !itemId || itemId === "new";
  const navigate = useNavigate();

  const prefListId = routeListId || searchParams.get("wishlist") || "";

  const [item, setItem] = useState(empty);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [targetId, setTargetId] = useState(prefListId || NEW_WISHLIST);
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
        if (isNew) {
          const res = await api.listWishlists();
          setWishlists(res.wishlists);
          if (prefListId && res.wishlists.some((w) => w.id === prefListId)) {
            setTargetId(prefListId);
          } else if (res.wishlists.length > 0 && !prefListId) {
            setTargetId(res.wishlists[0].id);
          } else if (!prefListId) {
            setTargetId(NEW_WISHLIST);
          }
        } else {
          const res = await api.getWishlist(routeListId);
          const found = res.wishlist.items.find((i) => i.id === itemId);
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
          setClaimed(found.claimed);
          setClaimedBy(found.claimedBy);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [isNew, routeListId, itemId, prefListId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (isNew) {
        let listId = targetId;
        if (targetId === NEW_WISHLIST) {
          const title = newWishlistTitle.trim() || item.name.trim() || "Wishlist";
          const created = await api.createWishlist(title);
          listId = created.wishlist.id;
        }
        await api.addItem(listId, item);
        navigate(`/app/lists/${listId}`, { replace: true });
      } else {
        await api.updateItem(routeListId, itemId!, item);
        navigate(`/app/lists/${routeListId}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!itemId || isNew) return;
    if (!confirm("Delete this wish?")) return;
    await api.deleteItem(routeListId, itemId);
    navigate(`/app/lists/${routeListId}`, { replace: true });
  }

  async function onUnclaim() {
    if (!itemId || isNew) return;
    setBusy(true);
    try {
      const res = await api.unclaimItem(routeListId, itemId);
      const found = res.wishlist.items.find((i) => i.id === itemId);
      setClaimed(Boolean(found?.claimed));
      setClaimedBy(found?.claimedBy ?? null);
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
        <p className="muted">Loading…</p>
      </Screen>
    );
  }

  return (
    <Screen title={title} backTo={backTo} backLabel="Back" largeTitle>
      {!isNew && claimed ? (
        <div className="banner">
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
            <label>
              Wishlist
              <select
                className="select-field"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                required
              >
                {wishlists.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title}
                  </option>
                ))}
                <option value={NEW_WISHLIST}>New wishlist…</option>
              </select>
            </label>
            {targetId === NEW_WISHLIST ? (
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
        ) : null}

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
