import { Link } from "react-router-dom";

type Props = {
  title?: string;
  backTo?: string;
  backLabel?: string;
  right?: React.ReactNode;
  large?: boolean;
};

export default function TopBar({
  title,
  backTo,
  backLabel = "Back",
  right,
  large,
}: Props) {
  return (
    <header className={`top-bar ${large ? "top-bar-large" : ""}`}>
      <div className="top-bar-row">
        <div className="top-bar-side">
          {backTo ? (
            <Link to={backTo} className="back-link">
              <span aria-hidden="true" className="back-chevron">
                ‹
              </span>
              {backLabel}
            </Link>
          ) : (
            <span className="top-bar-spacer" />
          )}
        </div>
        {!large && title ? <h1 className="top-bar-title">{title}</h1> : <span />}
        <div className="top-bar-side top-bar-side-right">{right}</div>
      </div>
      {large && title ? <h1 className="screen-title">{title}</h1> : null}
    </header>
  );
}
