import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Shell from "../components/Shell";

export default function ResetPassword() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.reset(username.trim(), recoveryCode.trim(), newPassword);
      setUser(res.user);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell showAuth={false}>
      <div className="panel" style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1>Reset password</h1>
        <p className="muted">
          Enter one unused recovery code from account creation. That code will be
          consumed.
        </p>
        <form className="form-grid" onSubmit={onSubmit} style={{ marginTop: "1.1rem" }}>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label>
            Recovery code
            <input
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              placeholder="ABCDE-FGHIJ"
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Resetting…" : "Reset password"}
          </button>
        </form>
        <p className="muted" style={{ marginTop: "1rem" }}>
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
    </Shell>
  );
}
