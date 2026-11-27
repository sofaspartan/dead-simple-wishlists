import { ChevronRight, KeyRound, LogOut, Pencil } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Avatar from "../components/Avatar";
import AvatarCropDialog from "../components/AvatarCropDialog";
import Screen from "../components/Screen";

export default function Account() {
  const { user, logout, setUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file");
      return;
    }
    setError("");
    setCropFile(file);
    setCropOpen(true);
  }

  async function onSaveCrop(dataUrl: string) {
    setBusy(true);
    setError("");
    try {
      const res = await api.uploadAvatar(dataUrl);
      setUser(res.user);
      setCropOpen(false);
      setCropFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save avatar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Account" tabs largeTitle>
      <div className="account-profile-card">
        <div className="account-avatar-wrap">
          <Avatar
            name={user?.displayName || user?.username}
            imageUrl={user?.avatarUrl}
            size="lg"
          />
          <button
            type="button"
            className="account-avatar-edit"
            aria-label="Change avatar"
            onClick={() => fileRef.current?.click()}
          >
            <Pencil size={16} strokeWidth={2.25} aria-hidden="true" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={onPickFile}
          />
        </div>
        <div className="account-profile-text">
          <p className="account-name">@{user?.username}</p>
          <p className="muted">
            {user?.recoveryCodesRemaining ?? 0} recovery code
            {(user?.recoveryCodesRemaining ?? 0) === 1 ? "" : "s"} remaining
          </p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <ul className="nav-list">
        <li>
          <Link className="nav-row" to="/reset">
            <span
              className="nav-row-title"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              <KeyRound size={18} strokeWidth={1.75} aria-hidden="true" />
              Reset password
            </span>
            <span className="chevron" aria-hidden="true">
              <ChevronRight size={20} strokeWidth={1.75} />
            </span>
          </Link>
        </li>
      </ul>

      <button className="btn btn-ghost btn-block" type="button" onClick={() => void logout()}>
        <LogOut size={18} strokeWidth={2} aria-hidden="true" />
        Log out
      </button>

      <AvatarCropDialog
        open={cropOpen}
        file={cropFile}
        busy={busy}
        onCancel={() => {
          if (busy) return;
          setCropOpen(false);
          setCropFile(null);
        }}
        onSave={onSaveCrop}
      />
    </Screen>
  );
}
