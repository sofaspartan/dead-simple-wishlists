import { initialsFromName } from "../lib/initials";

type Props = {
  name?: string | null;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  alt?: string;
};

export default function Avatar({
  name,
  imageUrl,
  size = "sm",
  className = "",
  alt,
}: Props) {
  const initials = initialsFromName(name);
  const label = alt || (name ? `${name} avatar` : "Avatar");

  return (
    <span className={`avatar avatar-${size} ${className}`.trim()} aria-label={label} role="img">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="avatar-img" loading="lazy" />
      ) : (
        <span className="avatar-initials" aria-hidden="true">
          {initials}
        </span>
      )}
    </span>
  );
}
