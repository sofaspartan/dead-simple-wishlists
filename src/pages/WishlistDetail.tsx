import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type Wishlist } from "../api";
import Shell from "../components/Shell";

const emptyItem = { name: "", url: "", notes: "", price: "" };

export default function WishlistDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [item, setItem] = useState(emptyItem);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const shareUrl =
    typeof window !== "undefined" && wishlist
      ? `${window.location.origin}/w/${wishlist.shareSlug}`
      : "";

  async function load() {
    setLoading(true);
    try {
      const res = await api.getWishlist(id);
      setWishlist(res.wishlist);
      setTitle(res.wishlist.title);
      setDescription(res.wishlist.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function saveMeta(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await api.updateWishlist(id, { title, description });
      setWishlist(res.wishlist);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    }
  }

  async function onAddItem(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await api.addItem(id, item);
      setWishlist(res.wishlist);
      setItem(emptyItem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add item");
    }
  }

  async function onSaveItem(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    try {
      const res = await api.updateItem(id, editingId, item);
      setWishlist(res.wishlist);
      setEditingId(null);
      setItem(emptyItem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update item");
    }
  }

  async function onDeleteItem(itemId: string) {
    if (!confirm("Delete this item?")) return;
    try {
      const res = await api.deleteItem(id, itemId);
      setWishlist(res.wishlist);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  }

  async function onUnclaim(itemId: string) {
    try {
      const res = await api.unclaimItem(id, itemId);
      setWishlist(res.wishlist);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unclaim");
    }
  }

  async function onDeleteList() {
    if (!confirm("Delete this entire wishlist?")) return;
    await api.deleteWishlist(id);
    navigate("/app");
  }

  function startEdit(it: Wishlist["items"][number]) {
    setEditingId(it.id);
    setItem({
      name: it.name,
      url: it.url,
      notes: it.notes,
      price: it.price,
    });
  }

  if (loading) {
    return (
      <Shell>
        <p className="muted">Loading…</p>
      </Shell>
    );
  }

  if (!wishlist) {
    return (
      <Shell>
        <p className="error">{error || "Wishlist not found"}</p>
        <Link to="/app">Back</Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="stack">
        <div>
          <Link to="/app" className="muted">
            ← All wishlists
          </Link>
        </div>

        <form className="panel stack" onSubmit={saveMeta}>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Description
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes for you or visitors"
            />
          </label>
          <div className="row-actions" style={{ justifyContent: "flex-start" }}>
            <button className="btn btn-small" type="submit">
              Save details
            </button>
            <button className="btn btn-danger btn-small" type="button" onClick={() => void onDeleteList()}>
              Delete wishlist
            </button>
          </div>
        </form>

        <div className="panel">
          <h2>Share link</h2>
          <p className="muted">Anyone with this link can view and claim items.</p>
          <div className="share-box">
            <code>{shareUrl}</code>
            <button
              className="btn btn-ghost btn-small"
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <Link className="btn btn-small" to={`/w/${wishlist.shareSlug}`} target="_blank">
              Open
            </Link>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <form className="panel stack" onSubmit={editingId ? onSaveItem : onAddItem}>
          <h2>{editingId ? "Edit item" : "Add item"}</h2>
          <label>
            Name
            <input
              value={item.name}
              onChange={(e) => setItem((s) => ({ ...s, name: e.target.value }))}
              required
            />
          </label>
          <div className="split-2">
            <label>
              URL
              <input
                value={item.url}
                onChange={(e) => setItem((s) => ({ ...s, url: e.target.value }))}
                placeholder="https://"
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
          </div>
          <label>
            Notes
            <textarea
              rows={2}
              value={item.notes}
              onChange={(e) => setItem((s) => ({ ...s, notes: e.target.value }))}
            />
          </label>
          <div className="row-actions" style={{ justifyContent: "flex-start" }}>
            <button className="btn" type="submit">
              {editingId ? "Save item" : "Add item"}
            </button>
            {editingId && (
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setItem(emptyItem);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="panel">
          <h2>Items</h2>
          {wishlist.items.length === 0 ? (
            <p className="empty">No items yet.</p>
          ) : (
            <div className="list">
              {wishlist.items.map((it) => (
                <div className="list-row" key={it.id}>
                  <div>
                    <h3>
                      {it.url ? (
                        <a href={it.url} target="_blank" rel="noreferrer">
                          {it.name}
                        </a>
                      ) : (
                        it.name
                      )}{" "}
                      {it.claimed && (
                        <span className="badge badge-claimed">
                          Claimed by {it.claimedBy || "Anonymous"}
                        </span>
                      )}
                    </h3>
                    <div className="item-meta">
                      {it.price && <span>{it.price}</span>}
                      {it.notes && <span>{it.notes}</span>}
                    </div>
                  </div>
                  <div className="row-actions">
                    {it.claimed && (
                      <button
                        className="btn btn-ghost btn-small"
                        type="button"
                        onClick={() => void onUnclaim(it.id)}
                      >
                        Unclaim
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-small"
                      type="button"
                      onClick={() => startEdit(it)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      type="button"
                      onClick={() => void onDeleteItem(it.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
