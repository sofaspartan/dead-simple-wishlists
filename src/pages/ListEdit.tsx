import { Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import Screen from "../components/Screen";
import { FormSkeleton } from "../components/Skeleton";

export default function ListEdit() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.getWishlist(id);
        setTitle(res.wishlist.title);
        setDescription(res.wishlist.description);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.updateWishlist(id, { title, description });
      navigate(`/app/lists/${id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm("Delete this wishlist? Wishes on it stay in Unlisted wishes.")) return;
    await api.deleteWishlist(id);
    navigate("/app", { replace: true });
  }

  if (loading) {
    return (
      <Screen
        title="Edit wishlist"
        backTo={`/app/lists/${id}`}
        backLabel="Wishlist"
        largeTitle={false}
      >
        <FormSkeleton count={2} label="Loading wishlist" />
      </Screen>
    );
  }

  return (
    <Screen title="Edit wishlist" backTo={`/app/lists/${id}`} backLabel="Wishlist" largeTitle>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Description
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-block" type="submit" disabled={busy}>
          <Save size={18} strokeWidth={2} aria-hidden="true" />
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
      <button className="btn btn-danger btn-block" type="button" onClick={() => void onDelete()}>
        <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
        Delete wishlist
      </button>
    </Screen>
  );
}
