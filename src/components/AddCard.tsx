import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  label: string;
  to?: string;
  onClick?: () => void;
};

export default function AddCard({ to, onClick, label }: Props) {
  const inner = (
    <>
      <span className="add-card-icon" aria-hidden="true">
        <Plus size={28} strokeWidth={2.25} />
      </span>
      <span className="add-card-label">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="add-card" onClick={onClick}>
        {inner}
      </button>
    );
  }

  if (!to) {
    throw new Error("AddCard requires either `to` or `onClick`");
  }

  return (
    <Link to={to} className="add-card">
      {inner}
    </Link>
  );
}
