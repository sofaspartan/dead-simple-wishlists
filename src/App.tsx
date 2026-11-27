import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useAuth } from "./auth";
import Account from "./pages/Account";
import Favorites from "./pages/Favorites";
import ItemForm from "./pages/ItemForm";
import Landing from "./pages/Landing";
import ListCreate from "./pages/ListCreate";
import ListDetail from "./pages/ListDetail";
import ListEdit from "./pages/ListEdit";
import ListShare from "./pages/ListShare";
import ListsHome from "./pages/ListsHome";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Search from "./pages/Search";
import SharedWishlist from "./pages/SharedWishlist";
import Signup from "./pages/Signup";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="phone-frame">
        <div className="phone-scroll">
          <p className="muted" style={{ padding: "2rem 1.25rem" }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset" element={<ResetPassword />} />
      <Route path="/w/:slug" element={<SharedWishlist />} />

      <Route
        path="/app"
        element={
          <Protected>
            <ListsHome />
          </Protected>
        }
      />
      <Route
        path="/app/new"
        element={
          <Protected>
            <ListCreate />
          </Protected>
        }
      />
      <Route
        path="/app/account"
        element={
          <Protected>
            <Account />
          </Protected>
        }
      />
      <Route
        path="/app/search"
        element={
          <Protected>
            <Search />
          </Protected>
        }
      />
      <Route
        path="/app/favorites"
        element={
          <Protected>
            <Favorites />
          </Protected>
        }
      />
      <Route
        path="/app/lists/:id"
        element={
          <Protected>
            <ListDetail />
          </Protected>
        }
      />
      <Route
        path="/app/lists/:id/edit"
        element={
          <Protected>
            <ListEdit />
          </Protected>
        }
      />
      <Route
        path="/app/lists/:id/share"
        element={
          <Protected>
            <ListShare />
          </Protected>
        }
      />
      <Route
        path="/app/lists/:id/items/new"
        element={
          <Protected>
            <ItemForm />
          </Protected>
        }
      />
      <Route
        path="/app/lists/:id/items/:itemId"
        element={
          <Protected>
            <ItemForm />
          </Protected>
        }
      />

      {/* Legacy redirects from MVP paths */}
      <Route path="/app/wishlists/:id" element={<LegacyListRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function LegacyListRedirect() {
  const { id } = useParams();
  return <Navigate to={`/app/lists/${id}`} replace />;
}
