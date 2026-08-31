import { useId } from "react";

/**
 * Avahub brand wordmark — vector recreation of the real logo:
 * "AVA" letters with blue→violet gradient and an audio waveform inside the V,
 * "HUB" in white. Fully scalable, crisp on every screen.
 */

const A_PATH =
  "M0 100 L36 0 L56 0 L92 100 L72 100 L63.4 76 L28.6 76 L20 100 Z M34.5 60 L46 26 L57.5 60 Z";
const V_PATH = "M0 0 L20 0 L46 74 L72 0 L92 0 L55 100 L37 100 Z";
const H_PATH =
  "M0 0 L18 0 L18 38 L64 38 L64 0 L82 0 L82 100 L64 100 L64 56 L18 56 L18 100 L0 100 Z";
const U_PATH =
  "M0 0 L18 0 L18 66 Q18 82 41 82 Q64 82 64 66 L64 0 L82 0 L82 66 Q82 100 41 100 Q0 100 0 66 Z";
const B_PATH =
  "M0 0 L46 0 Q78 0 78 25 Q78 40 64 47 Q80 52 80 73 Q80 100 48 100 L0 100 Z M18 16 L44 16 Q59 16 59 26 Q59 36 44 36 L18 36 Z M18 53 L46 53 Q61 53 61 65.5 Q61 78 46 78 L18 78 Z";

const BARS: Array<{ x: number; h: number }> = [
  { x: 138, h: 30 },
  { x: 145, h: 52 },
  { x: 152, h: 70 },
  { x: 159, h: 52 },
  { x: 166, h: 30 },
];

export function AvahubWordmark({ className }: { className?: string }) {
  const id = useId();
  const gradId = `ava-grad-${id.replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 598 100"
      className={className}
      role="img"
      aria-label="آواهاب ایونتس"
      fill="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3e9df5" />
          <stop offset="0.5" stopColor="#6e56f0" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      {/* AVA — gradient with waveform inside the V */}
      <g fill={`url(#${gradId})`} fillRule="evenodd">
        <path d={A_PATH} />
        <path d={V_PATH} transform="translate(106 0)" />
        <path d={A_PATH} transform="translate(212 0)" />
      </g>
      {/* waveform bars (dark cutouts over the V) */}
      <g fill="#0a0a0f">
        {BARS.map((bar) => (
          <rect
            key={bar.x}
            x={bar.x - 3}
            y={50 - bar.h / 2}
            width={6}
            height={bar.h}
            rx={3}
          />
        ))}
      </g>

      {/* HUB — white */}
      <g fill="currentColor">
        <path d={H_PATH} transform="translate(328 0)" />
        <path d={U_PATH} transform="translate(424 0)" />
        <path d={B_PATH} transform="translate(520 0)" />
      </g>
    </svg>
  );
}

export function AvahubLogo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className ?? ""}`}>
      <AvahubWordmark className="h-4 w-auto text-foreground sm:h-[18px]" />
      <span className="text-[9px] font-bold tracking-[0.55em] text-primary sm:text-[10px]">
        EVENTS
      </span>
    </span>
  );
}
