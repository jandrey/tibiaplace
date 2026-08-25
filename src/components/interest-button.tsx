import { cn } from "@/lib/utils";

type InterestButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  target?: string;
  rel?: string;
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "children" | "disabled"
>;

function InterestButtonContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span className="interest-btn__ambient" aria-hidden="true" />
      <span className="interest-btn__ring" aria-hidden="true" />
      <span className="interest-btn__shimmer" aria-hidden="true" />
      <span className="interest-btn__label">
        <span className="interest-btn__text">{children}</span>
        <svg
          className="interest-btn__arrow"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </>
  );
}

export function InterestButton({
  children,
  className,
  disabled,
  href,
  target,
  rel,
  type = "button",
  ...rest
}: InterestButtonProps) {
  const classes = cn(
    "interest-btn group",
    disabled && "interest-btn--disabled",
    className,
  );

  if (href && !disabled) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={classes}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        <InterestButtonContent>{children}</InterestButtonContent>
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={classes}
      {...rest}
    >
      <InterestButtonContent>{children}</InterestButtonContent>
    </button>
  );
}
