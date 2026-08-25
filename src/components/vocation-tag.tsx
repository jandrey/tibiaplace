import { useId } from "react";
import { cn, vocationShortLabel } from "@/lib/utils";
import { vocationTagTheme } from "@/lib/vocation-colors";

export function VocationTag({
  vocation,
  className,
}: {
  vocation: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const label = vocationShortLabel(vocation);
  const theme = vocationTagTheme(vocation);
  const fontSize = label.length <= 2 ? 10 : label.length <= 4 ? 8.5 : 7;
  const gradientId = `vocation-tag-grad-${uid}`;
  const filterId = `vocation-tag-shadow-${uid}`;
  const maskId = `vocation-tag-mask-${uid}`;

  return (
    <span
      title={vocation}
      className={cn(
        "pointer-events-none inline-flex h-[46px] w-[34px] shrink-0 drop-shadow-md",
        className,
      )}
      aria-label={vocation}
    >
      <svg
        viewBox="0 0 34 46"
        className="h-full w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={theme.from} />
            <stop offset="100%" stopColor={theme.to} />
          </linearGradient>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="2"
              floodColor={theme.glow}
              floodOpacity="1"
            />
          </filter>
          <mask id={maskId}>
            <path
              d="M17 1 L31 12.5 V41.5 C31 43.985 28.985 46 26.5 46 H7.5 C5.015 46 3 43.985 3 41.5 V12.5 Z"
              fill="white"
            />
            <circle cx="17" cy="8.5" r="2.6" fill="black" />
          </mask>
        </defs>

        <path
          d="M17 1 L31 12.5 V41.5 C31 43.985 28.985 46 26.5 46 H7.5 C5.015 46 3 43.985 3 41.5 V12.5 Z"
          fill={`url(#${gradientId})`}
          stroke={theme.stroke}
          strokeWidth="1"
          mask={`url(#${maskId})`}
          filter={`url(#${filterId})`}
        />

        <text
          x="17"
          y="31"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#ffffff"
          fontSize={fontSize}
          fontWeight="700"
          letterSpacing="0.06em"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
        >
          {label}
        </text>
      </svg>
    </span>
  );
}
