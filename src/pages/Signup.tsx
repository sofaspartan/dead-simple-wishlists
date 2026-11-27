import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Shell from "../components/Shell";

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

  return (
    <Shell showAuth={false}>
      <div className="panel" style={{ maxWidth: 520, margin: "0 auto" }}>
        {!recoveryCodes ? (
          <>
            <h1>Create account</h1>
            <p className="muted">
              No email needed. You’ll get recovery codes to save instead.
            </p>
            <form className="form-grid" onSubmit={onSubmit} style={{ marginTop: "1.1rem" }}>
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
              <button className="btn" type="submit" disabled={busy}>
                {busy ? "Creating…" : "Create account"}
              </button>
            </form>
            <p className="muted" style={{ marginTop: "1rem" }}>
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </>
        ) : (
          <>
            <h1>Save your recovery codes</h1>
            <p className="muted">
              These are the only way to reset your password. Store them somewhere
              safe—each code works once.
            </p>
            <div className="codes">
              {recoveryCodes.map((code) => (
                <div className="code" key={code}>
                  {code}
                </div>
              ))}
            </div>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(recoveryCodes.join("\n"));
              }}
            >
              Copy codes
            </button>
            <label className="check-row" style={{ marginTop: "1rem" }}>
              <input
                type="checkbox"
                checked={saved}
                onChange={(e) => setSaved(e.target.checked)}
              />
              <span>I’ve saved these codes</span>
            </label>
            <button
              className="btn"
              type="button"
              disabled={!saved}
              onClick={() => setDone(true)}
              style={{ marginTop: "0.75rem" }}
            >
              Continue to my wishlists
            </button>
          </>
        )}
      </div>
    </Shell>
  );
}
