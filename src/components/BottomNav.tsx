import { Heart, Home, Plus, Search, UserRound } from "lucide-react";
import { useCallback, useState } from "react";
import { NavLink, useMatch } from "react-router-dom";
import AddSheet from "./AddSheet";

const iconProps = { size: 22, strokeWidth: 1.75, "aria-hidden": true as const };

export default function BottomNav() {
  const [addOpen, setAddOpen] = useState(false);
  const listMatch = useMatch({ path: "/app/lists/:id", end: false });
  const listId = listMatch?.params.id;
  const closeAdd = useCallback(() => setAddOpen(false), []);

  return (
    <>
      <nav className="bottom-nav" aria-label="Main">
        <NavLink to="/app" end className={({ isActive }) => (isActive ? "tab active" : "tab")}>
          <span className="tab-icon">
            <Home {...iconProps} />
          </span>
          Home
        </NavLink>
        <NavLink
          to="/app/search"
          className={({ isActive }) => (isActive ? "tab active" : "tab")}
        >
          <span className="tab-icon">
            <Search {...iconProps} />
          </span>
          Search
        </NavLink>

        <div className="tab-add-slot">
          <button
            type="button"
            className={`tab-add${addOpen ? " open" : ""}`}
            aria-label="Add"
            aria-haspopup="dialog"
            aria-expanded={addOpen}
            onClick={() => setAddOpen((v) => !v)}
          >
            <Plus size={28} strokeWidth={2.25} aria-hidden="true" />
          </button>
        </div>

        <NavLink
          to="/app/favorites"
          className={({ isActive }) => (isActive ? "tab active" : "tab")}
        >
          <span className="tab-icon">
            <Heart {...iconProps} />
          </span>
          Favorites
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

      <AddSheet open={addOpen} onClose={closeAdd} listId={listId} />
    </>
  );
}
