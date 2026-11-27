import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Wishlist } from "../api";
import Shell from "../components/Shell";

export default function Dashboard() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.listWishlists();
      setWishlists(res.wishlists);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.createWishlist(title.trim());
      setWishlists((prev) => [res.wishlist, ...prev]);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this wishlist?")) return;
    try {
      await api.deleteWishlist(id);
      setWishlists((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  }

  return (
    <Shell>
      <div className="stack">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em", margin: 0 }}>
            Your wishlists
          </h1>
          <p className="muted" style={{ marginTop: "0.35rem" }}>
            Create a list, add items, share one link.
          </p>
        </div>

        <form className="panel inline-form" onSubmit={onCreate}>
          <label>
            New wishlist
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Birthday, holidays, housewarming…"
              required
            />
          </label>
          <button className="btn" type="submit" disabled={busy || !title.trim()}>
            {busy ? "Creating…" : "Create"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <div className="panel">
          {loading ? (
            <p className="muted">Loading…</p>
          ) : wishlists.length === 0 ? (
            <p className="empty">No wishlists yet. Create your first one above.</p>
          ) : (
            <div className="list">
              {wishlists.map((w) => (
                <div className="list-row" key={w.id}>
                  <div>
                    <h3>
                      <Link to={`/app/wishlists/${w.id}`}>{w.title}</Link>
                    </h3>
                    <div className="item-meta">
                      <span>
                        {w.items.length} item{w.items.length === 1 ? "" : "s"}
                      </span>
                      <span>
                        {w.items.filter((i) => i.claimed).length} claimed
                      </span>
                    </div>
                  </div>
                  <div className="row-actions">
                    <Link className="btn btn-ghost btn-small" to={`/app/wishlists/${w.id}`}>
                      Open
                    </Link>
                    <button
                      className="btn btn-danger btn-small"
                      type="button"
                      onClick={() => void onDelete(w.id)}
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
