"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** delay for staggered entrance (seconds) */
  delay?: number;
  /** max tilt degrees */
  max?: number;
  /** glow color for cursor-follow light */
  glow?: string;
};

/**
 * Cinematic animated card:
 * 1) Staggered spring entrance when scrolled into view
 * 2) Mouse-tracking 3D tilt with buttery springs
 * 3) Cursor-following radial glow
 * 4) Inner parallax layers via --px/--py CSS vars (.tilt-depth-*)
 * Respects prefers-reduced-motion (renders a static card).
 */
export function TiltCard({
  children,
  className = "",
  delay = 0,
  max = 9,
  glow = "rgba(212,175,55,0.16)",
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 22, mass: 0.6 });
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 22, mass: 0.6 });
  const scale = useSpring(useMotionValue(1), { stiffness: 260, damping: 24 });

  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const glowBg = useMotionTemplate`radial-gradient(340px circle at ${gx}% ${gy}%, ${glow}, transparent 72%)`;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || !ref.current) return;
    if (e.pointerType && e.pointerType !== "mouse") return;
    const rect = ref.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    ry.set((nx - 0.5) * max * 2);
    rx.set(-(ny - 0.5) * max * 2);
    scale.set(1.025);

    gx.set(nx * 100);
    gy.set(ny * 100);
    px.set(nx * 2 - 1);
    py.set(ny * 2 - 1);

    ref.current.style.setProperty("--gx", `${nx * 100}%`);
    ref.current.style.setProperty("--gy", `${ny * 100}%`);
    ref.current.style.setProperty("--px", `${(nx * 2 - 1).toFixed(3)}`);
    ref.current.style.setProperty("--py", `${(ny * 2 - 1).toFixed(3)}`);
  };

  const onLeave = () => {
    rx.set(0);
    ry.set(0);
    scale.set(1);
    px.set(0);
    py.set(0);
  };

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, y: 46, scale: 0.93, rotateX: 10 }}
      whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, type: "spring", stiffness: 120, damping: 17, mass: 0.9 }}
      style={{
        rotateX: rx,
        rotateY: ry,
        scale,
        transformPerspective: 950,
        transformStyle: "preserve-3d",
      }}
      className={`group relative ${className}`}
    >
      {/* cursor-follow glow */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: glowBg }}
      />
      {children}
    </motion.div>
  );
}
