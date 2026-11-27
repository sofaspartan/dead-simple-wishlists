import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Wishlist, type WishlistItem } from "../api";
import AppFrame from "../components/AppFrame";
import TopBar from "../components/TopBar";

export default function SharedWishlist() {
  const { slug = "" } = useParams();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<WishlistItem | null>(null);
  const [claimerName, setClaimerName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await api.getShared(slug);
        setWishlist(res.wishlist);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  async function onClaim(e: FormEvent) {
    e.preventDefault();
    if (!claiming) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.claim(slug, claiming.id, claimerName, anonymous);
      setWishlist(res.wishlist);
      setClaiming(null);
      setClaimerName("");
      setAnonymous(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not claim");
    } finally {
      setBusy(false);
    }
  }

  if (claiming) {
    return (
      <AppFrame>
        <header className="top-bar top-bar-large">
          <div className="top-bar-row">
            <div className="top-bar-side">
              <button type="button" className="back-link" onClick={() => setClaiming(null)}>
                <span className="back-chevron" aria-hidden="true">
                  ‹
                </span>
                {wishlist?.title || "List"}
              </button>
            </div>
          </div>
          <h1 className="screen-title">Claim item</h1>
        </header>
        <div className="screen-body">
          <p className="lead-strong">{claiming.name}</p>
          <p className="muted lead">
            Leave your name so the owner knows who’s bringing it—or claim
            anonymously.
          </p>
          <form className="form-grid" onSubmit={onClaim}>
            <label>
              Your name
              <input
                value={claimerName}
                onChange={(e) => setClaimerName(e.target.value)}
                disabled={anonymous}
                placeholder="Alex"
                autoFocus
              />
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
              <span>Claim anonymously</span>
            </label>
            {error && <p className="error">{error}</p>}
            <button
              className="btn btn-block"
              type="submit"
              disabled={busy || (!anonymous && !claimerName.trim())}
            >
              {busy ? "Claiming…" : "Confirm claim"}
            </button>
          </form>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      <TopBar title="Shared list" large />
      <div className="screen-body">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : !wishlist ? (
          <>
            <h1 className="screen-title">Not found</h1>
            <p className="muted">{error || "This share link may be invalid."}</p>
            <Link to="/">Go home</Link>
          </>
        ) : (
          <>
            <p className="eyebrow">Shared wishlist</p>
            <h1 className="screen-title" style={{ marginTop: 0 }}>
              {wishlist.title}
            </h1>
            {wishlist.description ? (
              <p className="muted lead">{wishlist.description}</p>
            ) : null}
            {error && <p className="error">{error}</p>}
            {wishlist.items.length === 0 ? (
              <p className="empty">Nothing on this list yet.</p>
            ) : (
              <ul className="nav-list">
                {wishlist.items.map((it) => (
                  <li key={it.id} className="nav-row static-row">
                    <div>
                      <span className="nav-row-title">
                        {it.url ? (
                          <a href={it.url} target="_blank" rel="noreferrer">
                            {it.name}
                          </a>
                        ) : (
                          it.name
                        )}
                      </span>
                      <span className="nav-row-meta">
                        {[
                          it.price,
                          it.claimed
                            ? `Claimed${it.claimedBy ? ` · ${it.claimedBy}` : " · Anonymous"}`
                            : null,
                          it.notes,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                    {!it.claimed ? (
                      <button
                        className="btn btn-small"
                        type="button"
                        onClick={() => setClaiming(it)}
                      >
                        Claim
                      </button>
                    ) : (
                      <span className="badge badge-claimed">Taken</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </AppFrame>
  );
}
