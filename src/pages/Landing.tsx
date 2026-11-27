import { ArrowRight, LogIn } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth";
import AppFrame from "../components/AppFrame";

export default function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/app" replace />;

  return (
    <AppFrame className="landing-frame">
      <section className="hero-screen">
        <p className="hero-brand">Wish</p>
        <h1>Lists people can actually use.</h1>
        <p className="hero-copy">
          Create wishlists, share one link, and let friends claim gifts—no email,
          no clutter.
        </p>
        <div className="hero-cta">
          <Link className="btn btn-block" to="/signup">
            Get started
            <ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" />
          </Link>
          <Link className="btn btn-ghost btn-block" to="/login">
            <LogIn size={18} strokeWidth={2} aria-hidden="true" />
            Log in
          </Link>
        </div>
      </section>
    </AppFrame>
  );
}
