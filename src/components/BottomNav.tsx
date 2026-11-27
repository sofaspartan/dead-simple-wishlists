import { List, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const iconProps = { size: 22, strokeWidth: 1.75, "aria-hidden": true as const };

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <NavLink to="/app" end className={({ isActive }) => (isActive ? "tab active" : "tab")}>
        <span className="tab-icon">
          <List {...iconProps} />
        </span>
        Lists
      </NavLink>
      <NavLink
        to="/app/account"
        className={({ isActive }) => (isActive ? "tab active" : "tab")}
      >
        <span className="tab-icon">
          <UserRound {...iconProps} />
        </span>
        Account
      </NavLink>
    </nav>
  );
}
