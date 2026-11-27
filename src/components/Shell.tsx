import { Link } from "react-router-dom";
import { useAuth } from "../auth";

export default function Shell({
  children,
  showAuth = true,
}: {
  children: React.ReactNode;
  showAuth?: boolean;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to={user ? "/app" : "/"} className="brand">
          Wish
        </Link>
        {showAuth && (
          <div className="nav-actions">
            {user ? (
              <>
                <span className="muted">@{user.username}</span>
                <button className="btn btn-ghost btn-small" type="button" onClick={() => void logout()}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-ghost btn-small" to="/login">
                  Log in
                </Link>
                <Link className="btn btn-small" to="/signup">
                  Create account
                </Link>
              </>
            )}
          </div>
        )}
      </header>
      {children}
    </div>
  );
}
