import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { useAuth } from "./auth";
import {
  AccountSkeleton,
  AppBootSkeleton,
  DetailSkeleton,
  FormSkeleton,
} from "./components/Skeleton";
import Screen from "./components/Screen";
import Account from "./pages/Account";
import Favorites from "./pages/Favorites";
import ItemForm from "./pages/ItemForm";
import Landing from "./pages/Landing";
import ListCreate from "./pages/ListCreate";
import ListDetail from "./pages/ListDetail";
import ListEdit from "./pages/ListEdit";
import ListsHome from "./pages/ListsHome";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import SharedWishlist from "./pages/SharedWishlist";
import Signup from "./pages/Signup";

function ProtectedBootSkeleton() {
  const { pathname } = useLocation();

  if (pathname === "/app/account") {
    return (
      <Screen title="Account" tabs largeTitle>
        <AccountSkeleton label="Loading account" />
      </Screen>
    );
  }

  if (/^\/app\/lists\/[^/]+$/.test(pathname)) {
    return (
      <Screen title="Wishlist" backTo="/app" backLabel="Home" tabs largeTitle={false}>
        <DetailSkeleton label="Loading wishlist" />
      </Screen>
    );
  }

  if (
    pathname.includes("/edit") ||
    pathname.includes("/items/") ||
    pathname.includes("/wishes/") ||
    pathname === "/app/new"
  ) {
    return (
      <Screen title="Wish" backTo="/app" backLabel="Back" largeTitle={false}>
        <FormSkeleton count={3} label="Loading" />
      </Screen>
    );
  }

  return <AppBootSkeleton label="Loading" />;
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <ProtectedBootSkeleton />;
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
      <Route path="/app/search" element={<Navigate to="/app" replace />} />
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
      <Route path="/app/lists/:id/share" element={<LegacyShareRedirect />} />
      <Route
        path="/app/wishes/new"
        element={
          <Protected>
            <ItemForm />
          </Protected>
        }
      />
      <Route
        path="/app/wishes/:itemId"
        element={
          <Protected>
            <ItemForm />
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

function LegacyShareRedirect() {
  const { id } = useParams();
  return <Navigate to={`/app/lists/${id}`} replace />;
}
