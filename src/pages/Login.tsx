import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Screen from "../components/Screen";

export default function Login() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.login(username.trim(), password);
      setUser(res.user);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="Log in" backTo="/" backLabel="Wish" largeTitle>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Username
          <input
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-block" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Log in"}
        </button>
      </form>
      <p className="muted footer-links">
        <Link to="/reset">Forgot password?</Link>
        <br />
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </Screen>
  );
}
