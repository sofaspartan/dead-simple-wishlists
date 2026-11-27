import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import Screen from "../components/Screen";

export default function ListCreate() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.createWishlist(title.trim(), description.trim());
      navigate(`/app/lists/${res.wishlist.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create");
      setBusy(false);
    }
  }

  return (
    <Screen title="New list" backTo="/app" backLabel="Lists" largeTitle>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Birthday, holidays…"
            required
            autoFocus
          />
        </label>
        <label>
          Description
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional note for you or visitors"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-block" type="submit" disabled={busy || !title.trim()}>
          {busy ? "Creating…" : "Create list"}
        </button>
      </form>
    </Screen>
  );
}
