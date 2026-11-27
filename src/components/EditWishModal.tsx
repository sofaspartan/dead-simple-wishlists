import { Save, Search as SearchIcon, Trash2, Undo2, X } from "lucide-react";
import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api, type Wishlist } from "../api";
import { FormSkeleton } from "./Skeleton";

type Props = {
  open: boolean;
  wishId: string | null;
  onClose: () => void;
  onSaved?: () => void;
  onDeleted?: () => void;
};

type Tab = "info" | "lists";

const empty = { name: "", url: "", notes: "", price: "" };

function portalTarget(): HTMLElement {
  return document.querySelector<HTMLElement>(".phone-frame") ?? document.body;
}

export default function EditWishModal({
  open,
  wishId,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const titleId = useId();
  const listsLabelId = useId();
  const [tab, setTab] = useState<Tab>("info");
  const [item, setItem] = useState(empty);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [listQuery, setListQuery] = useState("");
  const [claimed, setClaimed] = useState(false);
  const [claimedBy, setClaimedBy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !wishId) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);

    setTab("info");
    setListQuery("");
    setError("");
    setBusy(false);
    setLoading(true);

    void (async () => {
      try {
        const [wishRes, listsRes] = await Promise.all([
          api.getWish(wishId),
          api.listWishlists(),
        ]);
        const found = wishRes.wish;
        setItem({
          name: found.name,
          url: found.url,
          notes: found.notes,
          price: found.price,
        });
        setSelectedListIds(found.wishlistIds || []);
        setClaimed(found.claimed);
        setClaimedBy(found.claimedBy);
        setWishlists(listsRes.wishlists);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();

    return () => document.removeEventListener("keydown", onKey);
  }, [open, wishId, onClose]);

  const filteredWishlists = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return wishlists;
    return wishlists.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        (w.description || "").toLowerCase().includes(q),
    );
  }, [wishlists, listQuery]);

  if (!open || !wishId || typeof document === "undefined") return null;

  function toggleList(id: string) {
    setSelectedListIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!wishId) return;
    setBusy(true);
    setError("");
    try {
      await api.updateWish(wishId, { ...item, wishlistIds: selectedListIds });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!wishId) return;
    if (!confirm("Delete this wish?")) return;
    setBusy(true);
    setError("");
    try {
      await api.deleteWish(wishId);
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
      setBusy(false);
    }
  }

  async function onUnclaim() {
    if (!wishId) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.unclaimWish(wishId);
      setClaimed(Boolean(res.wish.claimed));
      setClaimedBy(res.wish.claimedBy ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unclaim");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = item.name.trim().length > 0;

  return createPortal(
    <div className="app-modal-root" role="presentation">
      <button type="button" className="app-modal-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="app-modal app-modal-tall edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="app-modal-header">
          <h2 id={titleId} className="app-modal-title">
            Edit wish
          </h2>
          <button type="button" className="app-modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="edit-modal-tabs" role="tablist" aria-label="Edit wish sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "info"}
            className={`edit-modal-tab${tab === "info" ? " active" : ""}`}
            onClick={() => setTab("info")}
          >
            Information
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "lists"}
            className={`edit-modal-tab${tab === "lists" ? " active" : ""}`}
            onClick={() => setTab("lists")}
          >
            Lists
          </button>
        </div>

        {loading ? (
          <div className="app-modal-body">
            <FormSkeleton count={tab === "info" ? 4 : 2} label="Loading wish" />
          </div>
        ) : (
          <form className="edit-modal-form" onSubmit={onSubmit}>
            <div className="app-modal-body">
              {claimed ? (
                <div className="banner banner-claimed">
                  Claimed by {claimedBy || "Anonymous"}
                  <button
                    className="text-action"
                    type="button"
                    disabled={busy}
                    onClick={() => void onUnclaim()}
                  >
                    <Undo2 size={16} strokeWidth={2} aria-hidden="true" />
                    Unclaim
                  </button>
                </div>
              ) : null}

              {tab === "info" ? (
                <div className="form-grid">
                  <label>
                    Name
                    <input
                      value={item.name}
                      onChange={(e) => setItem((s) => ({ ...s, name: e.target.value }))}
                      required
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
                </div>
              ) : (
                <div className="edit-picker">
                  <p id={listsLabelId} className="edit-picker-label">
                    Wishlists
                  </p>
                  <p className="muted edit-modal-hint">
                    A wish can belong to multiple wishlists, or none (unlisted).
                  </p>
                  {wishlists.length > 0 ? (
                    <label className="search-field edit-picker-search">
                      <span className="search-field-icon" aria-hidden="true">
                        <SearchIcon size={20} strokeWidth={1.75} />
                      </span>
                      <input
                        type="search"
                        value={listQuery}
                        onChange={(e) => setListQuery(e.target.value)}
                        placeholder="Search wishlists"
                        autoComplete="off"
                        enterKeyHint="search"
                        aria-label="Search wishlists"
                      />
                    </label>
                  ) : null}
                  <div
                    className="wish-list-fieldset"
                    role="group"
                    aria-labelledby={listsLabelId}
                  >
                    {wishlists.length === 0 ? (
                      <p className="muted edit-modal-hint">
                        No wishlists yet — save to keep this wish unlisted.
                      </p>
                    ) : filteredWishlists.length === 0 ? (
                      <p className="muted edit-modal-hint">No matches</p>
                    ) : (
                      filteredWishlists.map((w) => (
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
                  </div>
                </div>
              )}

              {error ? <p className="error">{error}</p> : null}
            </div>

            <div className="edit-modal-actions">
              <button className="btn btn-block" type="submit" disabled={busy || !canSubmit}>
                <Save size={18} strokeWidth={2} aria-hidden="true" />
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                className="btn btn-danger btn-block"
                type="button"
                disabled={busy}
                onClick={() => void onDelete()}
              >
                <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
                Delete wish
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    portalTarget(),
  );
}
