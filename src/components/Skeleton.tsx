type CountProps = {
  count?: number;
  /** Accessible label for the loading region */
  label?: string;
};

function Bone({ className = "" }: { className?: string }) {
  return <span className={`skeleton-bone ${className}`.trim()} aria-hidden="true" />;
}

/** Single media-card placeholder (image + title/meta). */
export function CardSkeleton() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Bone className="skeleton-card-image" />
      <div className="skeleton-card-body">
        <Bone className="skeleton-line skeleton-line-title" />
        <Bone className="skeleton-line skeleton-line-meta" />
      </div>
    </div>
  );
}

/** 2-column card grid matching home / search / favorites / detail. */
export function CardGridSkeleton({ count = 4, label = "Loading" }: CountProps) {
  return (
    <ul className="card-grid skeleton-grid" aria-busy="true" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <CardSkeleton />
        </li>
      ))}
    </ul>
  );
}

/** Form field placeholders (edit wishlist / wish). */
export function FormSkeleton({ count = 3, label = "Loading" }: CountProps) {
  return (
    <div className="form-grid skeleton-form" aria-busy="true" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-field" aria-hidden="true">
          <Bone className="skeleton-line skeleton-line-label" />
          <Bone className="skeleton-input" />
        </div>
      ))}
      <Bone className="skeleton-btn" />
    </div>
  );
}

/** Share page: copy + URL block + actions. */
export function ShareSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div className="skeleton-share" aria-busy="true" aria-label={label}>
      <Bone className="skeleton-line skeleton-line-lead" />
      <Bone className="skeleton-line skeleton-line-lead short" />
      <Bone className="skeleton-share-url" />
      <Bone className="skeleton-btn" />
      <Bone className="skeleton-btn skeleton-btn-ghost" />
    </div>
  );
}

/** Account profile card + row placeholders (auth boot / account). */
export function AccountSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div className="skeleton-account" aria-busy="true" aria-label={label}>
      <div className="skeleton-account-card" aria-hidden="true">
        <Bone className="skeleton-avatar" />
        <Bone className="skeleton-line skeleton-line-title" />
        <Bone className="skeleton-line skeleton-line-meta" />
        <Bone className="skeleton-line skeleton-line-meta short" />
      </div>
      <Bone className="skeleton-nav-row" />
      <Bone className="skeleton-btn skeleton-btn-ghost" />
    </div>
  );
}

/** Mirrors WishlistHeaderCard: date, actions, title, avatar, handle. */
export function WishlistHeaderSkeleton() {
  return (
    <div className="wishlist-header-card skeleton-wishlist-header" aria-hidden="true">
      <div className="wishlist-header-top">
        <Bone className="skeleton-header-date" />
        <div className="wishlist-header-actions">
          <Bone className="skeleton-header-action" />
          <Bone className="skeleton-header-action" />
        </div>
      </div>
      <Bone className="skeleton-header-title" />
      <div className="wishlist-header-owner">
        <Bone className="skeleton-avatar skeleton-header-avatar" />
        <Bone className="skeleton-line skeleton-line-meta skeleton-header-handle" />
      </div>
    </div>
  );
}

/** Full-screen wish detail placeholder. */
export function WishDetailSkeleton({ label = "Loading wish" }: { label?: string }) {
  return (
    <div className="skeleton-wish-detail" aria-busy="true" aria-label={label}>
      <Bone className="skeleton-wish-hero" />
      <div className="skeleton-wish-body" aria-hidden="true">
        <Bone className="skeleton-line skeleton-line-title skeleton-wish-title" />
        <Bone className="skeleton-line skeleton-line-meta" />
        <Bone className="skeleton-line skeleton-line-lead" />
      </div>
    </div>
  );
}

/** Wishlist detail: header card + card grid. */
export function DetailSkeleton({
  label = "Loading",
  variant = "wishlist",
}: {
  label?: string;
  variant?: "wishlist" | "wish";
}) {
  if (variant === "wish") {
    return <WishDetailSkeleton label={label} />;
  }

  return (
    <div className="skeleton-detail" aria-busy="true" aria-label={label}>
      <WishlistHeaderSkeleton />
      <ul className="card-grid skeleton-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i}>
            <CardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Protected-route / app boot placeholder. */
export function AppBootSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div className="phone-frame has-tabs">
      <div className="phone-scroll">
        <div className="screen-body">
          <Bone className="skeleton-screen-title" />
          <CardGridSkeleton count={4} label={label} />
        </div>
      </div>
    </div>
  );
}
