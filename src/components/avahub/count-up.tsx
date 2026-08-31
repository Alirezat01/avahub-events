"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

function toFa(n: number) {
  return n.toLocaleString("fa-IR", { maximumFractionDigits: 0 });
}

/**
 * Animated number that counts up when scrolled into view.
 * Persian digits, reduced-motion aware.
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 1.8,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(() => toFa(0));

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(toFa(Math.round(v))),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref} className={className} dir="rtl">
      {prefix}
      {reduced ? toFa(value) : display}
      {suffix}
    </span>
  );
}
