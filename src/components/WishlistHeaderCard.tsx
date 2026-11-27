import { Calendar, Share2 } from "lucide-react";
import type { WishlistOwner } from "../api";
import Avatar from "./Avatar";
import MoreMenu, { type MoreMenuProps } from "./MoreMenu";

type Props = {
  title: string;
  createdAt: string;
  owner?: WishlistOwner | null;
  description?: string;
  /** Share control (owner or public) */
  onShare?: () => void;
  /** Owner-only: overflow menu props */
  menu?: MoreMenuProps;
};

function formatCreated(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function WishlistHeaderCard({
  title,
  createdAt,
  owner,
  description,
  onShare,
  menu,
}: Props) {
  const ownerName = owner?.displayName || owner?.username;
  const showActions = Boolean(onShare || menu);

  return (
    <section className="wishlist-header-card">
      <div className="wishlist-header-top">
        <p className="wishlist-header-date">
          <Calendar size={16} strokeWidth={2} aria-hidden="true" />
          <span>{formatCreated(createdAt)}</span>
        </p>
        {showActions ? (
          <div className="wishlist-header-actions">
            {onShare ? (
              <button
                type="button"
                className="wishlist-header-share"
                aria-label="Share wishlist"
                onClick={onShare}
              >
                <Share2 size={20} strokeWidth={2} aria-hidden="true" />
              </button>
            ) : null}
            {menu ? <MoreMenu {...menu} /> : null}
          </div>
        ) : null}
      </div>

      <h1 className="wishlist-header-title">{title}</h1>

      {owner ? (
        <div className="wishlist-header-owner">
          <Avatar name={ownerName} imageUrl={owner.avatarUrl} size="md" />
          {owner.username ? (
            <span className="wishlist-header-handle">@{owner.username}</span>
          ) : null}
        </div>
      ) : null}

      {description ? <p className="wishlist-header-desc muted">{description}</p> : null}
    </section>
  );
}
