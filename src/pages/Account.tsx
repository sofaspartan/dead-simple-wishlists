import { ChevronRight, KeyRound, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import Screen from "../components/Screen";

export default function Account() {
  const { user, logout } = useAuth();

  return (
    <Screen title="Account" tabs largeTitle>
      <div className="account-card">
        <p className="account-name">@{user?.username}</p>
        <p className="muted">
          {user?.recoveryCodesRemaining ?? 0} recovery code
          {(user?.recoveryCodesRemaining ?? 0) === 1 ? "" : "s"} remaining
        </p>
      </div>

      <ul className="nav-list">
        <li>
          <Link className="nav-row" to="/reset">
            <span className="nav-row-title" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
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
    </Screen>
  );
}
