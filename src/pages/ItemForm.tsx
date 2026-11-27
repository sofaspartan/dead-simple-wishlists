import { Plus, Save, Trash2, Undo2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import Screen from "../components/Screen";

const empty = { name: "", url: "", notes: "", price: "" };

export default function ItemForm() {
  const { id: listId = "", itemId } = useParams();
  const isNew = !itemId || itemId === "new";
  const navigate = useNavigate();
  const [item, setItem] = useState(empty);
  const [claimed, setClaimed] = useState(false);
  const [claimedBy, setClaimedBy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isNew) return;
    void (async () => {
      try {
        const res = await api.getWishlist(listId);
        const found = res.wishlist.items.find((i) => i.id === itemId);
        if (!found) {
          setError("Item not found");
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [isNew, listId, itemId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (isNew) {
        await api.addItem(listId, item);
      } else {
        await api.updateItem(listId, itemId!, item);
      }
      navigate(`/app/lists/${listId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!itemId || isNew) return;
    if (!confirm("Delete this item?")) return;
    await api.deleteItem(listId, itemId);
    navigate(`/app/lists/${listId}`, { replace: true });
  }

  async function onUnclaim() {
    if (!itemId || isNew) return;
    setBusy(true);
    try {
      const res = await api.unclaimItem(listId, itemId);
      const found = res.wishlist.items.find((i) => i.id === itemId);
      setClaimed(Boolean(found?.claimed));
      setClaimedBy(found?.claimedBy ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unclaim");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Screen
        title={isNew ? "Add item" : "Edit item"}
        backTo={`/app/lists/${listId}`}
        backLabel="List"
        largeTitle={false}
      >
        <p className="muted">Loading…</p>
      </Screen>
    );
  }

  return (
    <Screen
      title={isNew ? "Add item" : "Edit item"}
      backTo={`/app/lists/${listId}`}
      backLabel="List"
      largeTitle
    >
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
        <button className="btn btn-block" type="submit" disabled={busy}>
          {isNew ? (
            <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
          ) : (
            <Save size={18} strokeWidth={2} aria-hidden="true" />
          )}
          {busy ? "Saving…" : isNew ? "Add item" : "Save"}
        </button>
      </form>

      {!isNew ? (
        <button
          className="btn btn-danger btn-block"
          type="button"
          onClick={() => void onDelete()}
        >
          <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
          Delete item
        </button>
      ) : null}
    </Screen>
  );
}
