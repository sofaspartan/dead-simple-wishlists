import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Screen from "../components/Screen";

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
    <Screen title="Reset password" backTo="/login" backLabel="Log in" largeTitle>
      <p className="muted lead">
        Enter one unused recovery code. That code will be consumed.
      </p>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
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
        <button className="btn btn-block" type="submit" disabled={busy}>
          {busy ? "Resetting…" : "Reset password"}
        </button>
      </form>
      <p className="muted footer-links">
        <Link to="/login">Back to log in</Link>
      </p>
    </Screen>
  );
}
