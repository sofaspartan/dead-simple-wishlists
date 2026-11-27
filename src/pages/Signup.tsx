import { ArrowRight, Copy, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Screen from "../components/Screen";

export default function Signup() {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [done, setDone] = useState(false);

  if (user && !recoveryCodes) return <Navigate to="/app" replace />;
  if (user && recoveryCodes && done) return <Navigate to="/app" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.signup(username.trim(), password);
      setUser(res.user);
      setRecoveryCodes(res.recoveryCodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  if (recoveryCodes) {
    return (
      <Screen title="Save these codes" largeTitle>
        <p className="muted lead">
          These are the only way to reset your password. Each code works once.
        </p>
        <div className="codes">
          {recoveryCodes.map((code) => (
            <div className="code" key={code}>
              {code}
            </div>
          ))}
        </div>
        <button
          className="btn btn-ghost btn-block"
          type="button"
          onClick={() => void navigator.clipboard.writeText(recoveryCodes.join("\n"))}
        >
          <Copy size={18} strokeWidth={2} aria-hidden="true" />
          Copy codes
        </button>
        <label className="check-row">
          <input
            type="checkbox"
            checked={saved}
            onChange={(e) => setSaved(e.target.checked)}
          />
          <span>I’ve saved these codes</span>
        </label>
        <button
          className="btn btn-block"
          type="button"
          disabled={!saved}
          onClick={() => setDone(true)}
        >
          Continue to my wishlists
          <ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </Screen>
    );
  }

  return (
    <Screen title="Create account" backTo="/" backLabel="Wish" largeTitle>
      <p className="muted lead">No email needed—you’ll get recovery codes instead.</p>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Username
          <input
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="alex"
            required
            minLength={3}
            maxLength={32}
            pattern="[A-Za-z0-9_]+"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-block" type="submit" disabled={busy}>
          <UserPlus size={18} strokeWidth={2} aria-hidden="true" />
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="muted footer-links">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </Screen>
  );
}
