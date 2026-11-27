import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type Wishlist } from "../api";
import Shell from "../components/Shell";

export default function SharedWishlist() {
  const { slug = "" } = useParams();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
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
    if (!claimingId) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.claim(slug, claimingId, claimerName, anonymous);
      setWishlist(res.wishlist);
      setClaimingId(null);
      setClaimerName("");
      setAnonymous(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not claim");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="stack">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : !wishlist ? (
          <div className="panel">
            <h1>Wishlist not found</h1>
            <p className="muted">{error || "This share link may be invalid."}</p>
            <Link to="/">Go home</Link>
          </div>
        ) : (
          <>
            <div>
              <p className="muted" style={{ margin: 0 }}>
                Shared wishlist
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.04em",
                  margin: "0.2rem 0 0.4rem",
                  fontSize: "clamp(2rem, 6vw, 3rem)",
                }}
              >
                {wishlist.title}
              </h1>
              {wishlist.description && <p className="muted">{wishlist.description}</p>}
            </div>

            {error && <p className="error">{error}</p>}

            <div className="panel">
              {wishlist.items.length === 0 ? (
                <p className="empty">Nothing on this list yet.</p>
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
                              Claimed
                              {it.claimedBy ? ` · ${it.claimedBy}` : " · Anonymous"}
                            </span>
                          )}
                        </h3>
                        <div className="item-meta">
                          {it.price && <span>{it.price}</span>}
                          {it.notes && <span>{it.notes}</span>}
                        </div>
                      </div>
                      <div className="row-actions">
                        {!it.claimed && (
                          <button
                            className="btn btn-small"
                            type="button"
                            onClick={() => setClaimingId(it.id)}
                          >
                            Claim
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {claimingId && (
              <form className="panel stack" onSubmit={onClaim}>
                <h2>Claim this item</h2>
                <p className="muted">
                  Leave your name so the owner knows who’s bringing it—or claim
                  anonymously.
                </p>
                <label>
                  Your name
                  <input
                    value={claimerName}
                    onChange={(e) => setClaimerName(e.target.value)}
                    disabled={anonymous}
                    placeholder="Alex"
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
                <div className="row-actions" style={{ justifyContent: "flex-start" }}>
                  <button className="btn" type="submit" disabled={busy || (!anonymous && !claimerName.trim())}>
                    {busy ? "Claiming…" : "Confirm claim"}
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => setClaimingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
