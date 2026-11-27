import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth";
import Shell from "../components/Shell";

export default function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/app" replace />;

  return (
    <Shell>
      <section className="hero">
        <p className="hero-brand">Wish</p>
        <h1>Lists people can actually use.</h1>
        <p>
          Create wishlists, share one link, and let friends claim gifts—no email,
          no clutter.
        </p>
        <div className="hero-cta">
          <Link className="btn" to="/signup">
            Get started
          </Link>
          <Link className="btn btn-ghost" to="/login">
            Log in
          </Link>
        </div>
      </section>
    </Shell>
  );
}
