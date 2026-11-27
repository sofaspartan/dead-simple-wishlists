import { Gift, Inbox, LayoutList, type LucideIcon } from "lucide-react";

export type HomeView = "wishlists" | "all" | "unlisted";

const iconProps = { size: 22, strokeWidth: 1.75, "aria-hidden": true as const };

const OPTIONS: { id: HomeView; label: string; Icon: LucideIcon }[] = [
  { id: "wishlists", label: "Wishlists", Icon: LayoutList },
  { id: "all", label: "Wishes", Icon: Gift },
  { id: "unlisted", label: "Unlisted", Icon: Inbox },
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
        const { Icon } = opt;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`home-view-tab${active ? " active" : ""}`}
            onClick={() => onChange(opt.id)}
          >
            <span className="home-view-tab-icon">
              <Icon {...iconProps} />
            </span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
