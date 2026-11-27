import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Wishlist } from "../api";
import Screen from "../components/Screen";

export default function ListsHome() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

  return (
    <Screen
      title="Lists"
      tabs
      largeTitle
      right={
        <Link to="/app/new" className="text-action">
          New
        </Link>
      }
    >
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : wishlists.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">No lists yet</p>
          <p className="muted">Create a wishlist, add gifts, share one link.</p>
          <Link className="btn" to="/app/new">
            Create a list
          </Link>
        </div>
      ) : (
        <ul className="nav-list">
          {wishlists.map((w) => (
            <li key={w.id}>
              <Link className="nav-row" to={`/app/lists/${w.id}`}>
                <div>
                  <span className="nav-row-title">{w.title}</span>
                  <span className="nav-row-meta">
                    {w.items.length} item{w.items.length === 1 ? "" : "s"}
                    {w.items.some((i) => i.claimed)
                      ? ` · ${w.items.filter((i) => i.claimed).length} claimed`
                      : ""}
                  </span>
                </div>
                <span className="chevron" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
