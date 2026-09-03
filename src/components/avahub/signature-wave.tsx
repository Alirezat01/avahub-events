/**
 * SignatureWave — امضای بصری آواهاب (فاز ۲ طراحی)
 *
 * موج صوتی «آوا»: ردیفی از میله‌های عمودی با پوش متقارن (شکل V منطقی
 * کوه شباهنگ + موج صدا) با گرادیان بنفش → طلایی و هالهٔ بنفش.
 * این الگو در فوتر، تقسیم‌کنندهٔ سکشن‌ها و PageHero تکرار می‌شود تا
 * هویت شنیداری-بصری برند در همهٔ سایت مستقر شود.
 *
 * - animated: حالت اکولایزر زنده (با احترام کامل به prefers-reduced-motion —
 *   قانون سراسری CSS انیمیشن را غیرفعال می‌کند)
 * - ارتفاع میله‌ها قطعی (deterministic) است — بدون re-render تصادفی
 */

function barHeight(i: number, total: number): number {
  // پوش سینوسی متقارن + نوسان قطعی ملایم برای طبیعی‌شدن موج
  const t = total === 1 ? 0.5 : i / (total - 1);
  const bell = Math.sin(Math.PI * t) ** 1.15; // 0..1 متقارن
  const jitter =
    0.82 +
    0.18 * Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1); // hash قطعی
  return Math.max(0.14, Math.min(1, bell * jitter));
}

export function SignatureWave({
  bars = 36,
  animated = false,
  className = "",
  title,
}: {
  bars?: number;
  animated?: boolean;
  className?: string;
  /** متن توصیفی برای اسکرین‌ریدر (اگر موج صرفاً تزئینی باشد ارسال نشود) */
  title?: string;
}) {
  const H = 48; // viewBox height
  const W = 240;
  const gap = W / bars;
  const bw = gap * 0.42; // عرض میله

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="ava-wave-g" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7b4ddf" stopOpacity="0.25" />
          <stop offset="30%" stopColor="#7b4ddf" />
          <stop offset="55%" stopColor="#9d7bef" />
          <stop offset="80%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#e8cf7a" stopOpacity="0.45" />
        </linearGradient>
        <filter id="ava-wave-glow" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#ava-wave-glow)">
        {Array.from({ length: bars }, (_, i) => {
          const h = barHeight(i, bars) * (H - 8);
          const x = i * gap + (gap - bw) / 2;
          const y = (H - h) / 2;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={bw}
              height={h}
              rx={bw / 2}
              fill="url(#ava-wave-g)"
              className={animated ? "animate-wave-bar origin-center" : undefined}
              style={
                animated
                  ? { animationDelay: `${(i % 9) * 0.14}s` }
                  : undefined
              }
            />
          );
        })}
      </g>
    </svg>
  );
}
