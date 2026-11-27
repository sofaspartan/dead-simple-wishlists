import { Save, Search as SearchIcon, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api, type WishlistItem } from "../api";
import { FormSkeleton } from "./Skeleton";

type Props = {
  open: boolean;
  wishlistId: string | null;
  onClose: () => void;
  onSaved?: () => void;
  onDeleted?: () => void;
};

type Tab = "info" | "wishes";

function portalTarget(): HTMLElement {
  return document.querySelector<HTMLElement>(".phone-frame") ?? document.body;
}

export default function EditWishlistModal({
  open,
  wishlistId,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const titleId = useId();
  const wishesLabelId = useId();
  const [tab, setTab] = useState<Tab>("info");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allWishes, setAllWishes] = useState<WishlistItem[]>([]);
  const [selectedWishIds, setSelectedWishIds] = useState<string[]>([]);
  const [initialWishIds, setInitialWishIds] = useState<string[]>([]);
  const [wishQuery, setWishQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !wishlistId) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);

    setTab("info");
    setWishQuery("");
    setError("");
    setBusy(false);
    setLoading(true);

    void (async () => {
      try {
        const [listRes, wishesRes] = await Promise.all([
          api.getWishlist(wishlistId),
          api.listWishes("all"),
        ]);
        setTitle(listRes.wishlist.title);
        setDescription(listRes.wishlist.description);
        const onList = listRes.wishlist.items.map((i) => i.id);
        setSelectedWishIds(onList);
        setInitialWishIds(onList);
        const byId = new Map(wishesRes.wishes.map((w) => [w.id, w]));
        for (const item of listRes.wishlist.items) {
          if (!byId.has(item.id)) {
            byId.set(item.id, {
              ...item,
              wishlistIds: [...(item.wishlistIds || []), wishlistId].filter(
                (id, i, arr) => arr.indexOf(id) === i,
              ),
            });
          }
        }
        setAllWishes([...byId.values()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();

    return () => document.removeEventListener("keydown", onKey);
  }, [open, wishlistId, onClose]);

  const filteredWishes = useMemo(() => {
    const q = wishQuery.trim().toLowerCase();
    if (!q) return allWishes;
    return allWishes.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.notes || "").toLowerCase().includes(q) ||
        (w.url || "").toLowerCase().includes(q),
    );
  }, [allWishes, wishQuery]);

  if (!open || !wishlistId || typeof document === "undefined") return null;

  function toggleWish(id: string) {
    setSelectedWishIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  async function syncWishMemberships(listId: string) {
    const selected = new Set(selectedWishIds);
    const initial = new Set(initialWishIds);
    const changed = allWishes.filter((w) => {
      const wasOn = initial.has(w.id);
      const isOn = selected.has(w.id);
      return wasOn !== isOn;
    });

    await Promise.all(
      changed.map((w) => {
        const current = new Set(w.wishlistIds || []);
        if (selected.has(w.id)) current.add(listId);
        else current.delete(listId);
        return api.updateWish(w.id, { wishlistIds: [...current] });
      }),
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!wishlistId) return;
    setBusy(true);
    setError("");
    try {
      await api.updateWishlist(wishlistId, { title, description });
      await syncWishMemberships(wishlistId);
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!wishlistId) return;
    if (!confirm("Delete this wishlist? Wishes on it stay in Unlisted wishes.")) return;
    setBusy(true);
    setError("");
    try {
      await api.deleteWishlist(wishlistId);
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
      setBusy(false);
    }
  }

  const canSubmit = title.trim().length > 0;

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
            Edit wishlist
          </h2>
          <button type="button" className="app-modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="edit-modal-tabs" role="tablist" aria-label="Edit wishlist sections">
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
            aria-selected={tab === "wishes"}
            className={`edit-modal-tab${tab === "wishes" ? " active" : ""}`}
            onClick={() => setTab("wishes")}
          >
            Wishes
          </button>
        </div>

        {loading ? (
          <div className="app-modal-body">
            <FormSkeleton count={tab === "info" ? 2 : 3} label="Loading wishlist" />
          </div>
        ) : (
          <form className="edit-modal-form" onSubmit={onSubmit}>
            <div className="app-modal-body">
              {tab === "info" ? (
                <div className="form-grid">
                  <label>
                    Title
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Description
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </label>
                </div>
              ) : (
                <div className="edit-picker">
                  <p id={wishesLabelId} className="edit-picker-label">
                    Wishes on this list
                  </p>
                  <p className="muted edit-modal-hint">
                    Choose which wishes belong to this wishlist. Unchecked wishes stay in your
                    library (unlisted if on no lists).
                  </p>
                  {allWishes.length > 0 ? (
                    <label className="search-field edit-picker-search">
                      <span className="search-field-icon" aria-hidden="true">
                        <SearchIcon size={20} strokeWidth={1.75} />
                      </span>
                      <input
                        type="search"
                        value={wishQuery}
                        onChange={(e) => setWishQuery(e.target.value)}
                        placeholder="Search wishes"
                        autoComplete="off"
                        enterKeyHint="search"
                        aria-label="Search wishes"
                      />
                    </label>
                  ) : null}
                  <div
                    className="wish-list-fieldset"
                    role="group"
                    aria-labelledby={wishesLabelId}
                  >
                    {allWishes.length === 0 ? (
                      <p className="muted edit-modal-hint">No wishes yet — add one from Home.</p>
                    ) : filteredWishes.length === 0 ? (
                      <p className="muted edit-modal-hint">No matches</p>
                    ) : (
                      filteredWishes.map((w) => (
                        <label key={w.id} className="check-row">
                          <input
                            type="checkbox"
                            checked={selectedWishIds.includes(w.id)}
                            onChange={() => toggleWish(w.id)}
                          />
                          {w.name}
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
                Delete wishlist
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    portalTarget(),
  );
}
