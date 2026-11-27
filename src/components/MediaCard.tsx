import { Gift, LayoutList } from "lucide-react";
import { Link } from "react-router-dom";
import type { WishlistOwner } from "../api";
import Avatar from "./Avatar";
import MoreMenu, { type MoreMenuProps } from "./MoreMenu";

type Props = {
  to?: string;
  title: string;
  meta?: string;
  /** Visual variant for the placeholder graphic */
  variant?: "list" | "item";
  /** Optional remote image */
  imageUrl?: string;
  /** Creator shown bottom-right of the text area on wishlist cards */
  owner?: WishlistOwner | null;
  menu?: MoreMenuProps;
  footer?: React.ReactNode;
};

export default function MediaCard({
  to,
  title,
  meta,
  variant = "list",
  imageUrl,
  owner,
  menu,
  footer,
}: Props) {
  const Placeholder = variant === "item" ? Gift : LayoutList;

  const imageInner = imageUrl ? (
    <img src={imageUrl} alt="" className="media-card-img" loading="lazy" />
  ) : (
    <span className="media-card-placeholder" aria-hidden="true">
      <Placeholder size={40} strokeWidth={1.75} />
    </span>
  );

  const text = (
    <>
      <span className="media-card-title">{title}</span>
      {meta ? <span className="media-card-meta">{meta}</span> : null}
    </>
  );

  return (
    <article className="media-card">
      <div className={`media-card-image media-card-image-${variant}`}>
        {to ? (
          <Link to={to} className="media-card-image-link" tabIndex={-1} aria-hidden="true">
            {imageInner}
          </Link>
        ) : (
          imageInner
        )}
        {menu ? (
          <div className="media-card-menu">
            <MoreMenu {...menu} />
          </div>
        ) : null}
      </div>
      <div className="media-card-body">
        <div className="media-card-body-row">
          {to ? (
            <Link to={to} className="media-card-body-link">
              {text}
            </Link>
          ) : (
            <div className="media-card-body-text">{text}</div>
          )}
          {variant === "list" && owner ? (
            <div className="media-card-avatar">
              <Avatar
                name={owner.displayName || owner.username}
                imageUrl={owner.avatarUrl}
                size="sm"
              />
            </div>
          ) : null}
        </div>
        {footer}
      </div>
    </article>
  );
}
