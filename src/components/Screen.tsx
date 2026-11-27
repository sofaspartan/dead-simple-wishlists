import AppFrame from "./AppFrame";
import TopBar from "./TopBar";

type Props = {
  title?: string;
  backTo?: string;
  backLabel?: string;
  right?: React.ReactNode;
  tabs?: boolean;
  largeTitle?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function Screen({
  title,
  backTo,
  backLabel,
  right,
  tabs,
  largeTitle = true,
  children,
  footer,
}: Props) {
  return (
    <AppFrame tabs={tabs}>
      <TopBar
        title={title}
        backTo={backTo}
        backLabel={backLabel}
        right={right}
        large={largeTitle}
      />
      <div className="screen-body">{children}</div>
      {footer ? <div className="screen-footer">{footer}</div> : null}
    </AppFrame>
  );
}
