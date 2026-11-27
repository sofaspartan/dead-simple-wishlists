import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  to: string;
  label: string;
};

export default function AddCard({ to, label }: Props) {
  return (
    <Link to={to} className="add-card">
      <span className="add-card-icon" aria-hidden="true">
        <Plus size={28} strokeWidth={2.25} />
      </span>
      <span className="add-card-label">{label}</span>
    </Link>
  );
}
