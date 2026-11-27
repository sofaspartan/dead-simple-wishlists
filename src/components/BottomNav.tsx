import { NavLink } from "react-router-dom";

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <NavLink to="/app" end className={({ isActive }) => (isActive ? "tab active" : "tab")}>
        <span className="tab-icon" aria-hidden="true">
          ▤
        </span>
        Lists
      </NavLink>
      <NavLink
        to="/app/account"
        className={({ isActive }) => (isActive ? "tab active" : "tab")}
      >
        <span className="tab-icon" aria-hidden="true">
          ●
        </span>
        Account
      </NavLink>
    </nav>
  );
}
