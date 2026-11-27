export type HomeView = "wishlists" | "all" | "unlisted";

const OPTIONS: { id: HomeView; label: string }[] = [
  { id: "wishlists", label: "Wishlists" },
  { id: "all", label: "Wishes" },
  { id: "unlisted", label: "Unlisted" },
];

type Props = {
  value: HomeView;
  onChange: (view: HomeView) => void;
};

export default function HomeViewTitle({ value, onChange }: Props) {
  return (
    <div className="home-view-tabs" role="tablist" aria-label="Home view">
      {OPTIONS.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`home-view-tab${active ? " active" : ""}`}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
