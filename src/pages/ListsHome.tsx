import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Wishlist } from "../api";
import MoreMenu from "../components/MoreMenu";
import Screen from "../components/Screen";

export default function ListsHome() {
  const navigate = useNavigate();
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

  async function onDeleteList(id: string, title: string) {
    if (!confirm(`Delete “${title}”?`)) return;
    try {
      await api.deleteWishlist(id);
      setWishlists((list) => list.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  }

  return (
    <Screen title="Lists" tabs largeTitle>
      <div className="action-strip action-strip-center">
        <Link className="btn btn-small" to="/app/new">
          <Plus size={16} strokeWidth={2.25} aria-hidden="true" />
          New
        </Link>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : wishlists.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">No lists yet</p>
          <p className="muted">Create a wishlist, add gifts, share one link.</p>
          <Link className="btn" to="/app/new">
            <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
            Create a list
          </Link>
        </div>
      ) : (
        <ul className="nav-list">
          {wishlists.map((w) => (
            <li key={w.id}>
              <div className="nav-row">
                <Link className="nav-row-main" to={`/app/lists/${w.id}`}>
                  <span className="nav-row-title">{w.title}</span>
                  <span className="nav-row-meta">
                    {w.items.length} item{w.items.length === 1 ? "" : "s"}
                    {w.items.some((i) => i.claimed)
                      ? ` · ${w.items.filter((i) => i.claimed).length} claimed`
                      : ""}
                  </span>
                </Link>
                <MoreMenu
                  aria-label={`Actions for ${w.title}`}
                  onEdit={() => navigate(`/app/lists/${w.id}/edit`)}
                  onDelete={() => void onDeleteList(w.id, w.title)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
