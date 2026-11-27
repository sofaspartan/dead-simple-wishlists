import BottomNav from "./BottomNav";

type Props = {
  children: React.ReactNode;
  /** Show bottom tab bar (Lists / Account) */
  tabs?: boolean;
  className?: string;
};

export default function AppFrame({ children, tabs = false, className = "" }: Props) {
  return (
    <div className={`phone-frame ${tabs ? "has-tabs" : ""} ${className}`.trim()}>
      <div className="phone-scroll">{children}</div>
      {tabs ? <BottomNav /> : null}
    </div>
  );
}
