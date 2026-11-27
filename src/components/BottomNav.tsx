import { Heart, Home, Plus, Search, UserRound } from "lucide-react";
import { useCallback, useState } from "react";
import { NavLink, useMatch } from "react-router-dom";
import AddSheet from "./AddSheet";
import SearchModal from "./SearchModal";

const iconProps = { size: 22, strokeWidth: 1.75, "aria-hidden": true as const };

export default function BottomNav() {
  const [addOpen, setAddOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const listMatch = useMatch({ path: "/app/lists/:id", end: false });
  const listId = listMatch?.params.id;
  const closeAdd = useCallback(() => setAddOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <>
      <nav className="bottom-nav" aria-label="Main">
        <NavLink to="/app" end className={({ isActive }) => (isActive ? "tab active" : "tab")}>
          <span className="tab-icon">
            <Home {...iconProps} />
          </span>
          Home
        </NavLink>
        <button
          type="button"
          className={`tab${searchOpen ? " active" : ""}`}
          aria-label="Search"
          aria-haspopup="dialog"
          aria-expanded={searchOpen}
          onClick={() => {
            setAddOpen(false);
            setSearchOpen((v) => !v);
          }}
        >
          <span className="tab-icon">
            <Search {...iconProps} />
          </span>
          Search
        </button>

        <div className="tab-add-slot">
          <button
            type="button"
            className={`tab-add${addOpen ? " open" : ""}`}
            aria-label="Add"
            aria-haspopup="dialog"
            aria-expanded={addOpen}
            onClick={() => {
              setSearchOpen(false);
              setAddOpen((v) => !v);
            }}
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
      <SearchModal open={searchOpen} onClose={closeSearch} />
    </>
  );
}
