"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ChevronDown, Play, X } from "lucide-react";
import { AmbientParticles } from "./particles";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [teaserOpen, setTeaserOpen] = useState(false);

  // ── mouse parallax springs ──
  const nx = useMotionValue(0);
  const ny = useMotionValue(0);
  const sx = useSpring(nx, { stiffness: 55, damping: 16, mass: 0.8 });
  const sy = useSpring(ny, { stiffness: 55, damping: 16, mass: 0.8 });

  const triRotateY = useTransform(sx, [-1, 1], [-13, 13]);
  const triRotateX = useTransform(sy, [-1, 1], [9, -9]);
  const triX = useTransform(sx, [-1, 1], [-18, 18]);
  const triY = useTransform(sy, [-1, 1], [-12, 12]);
  const bgX = useTransform(sx, [-1, 1], [14, -14]);
  const textX = useTransform(sx, [-1, 1], [9, -9]);

  const onMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (reduced || !sectionRef.current) return;
    const pt = (e as unknown as { pointerType?: string }).pointerType;
    if (pt && pt !== "mouse") return;
    const rect = sectionRef.current.getBoundingClientRect();
    nx.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    ny.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const anim = (props: Record<string, unknown>) =>
    reduced ? {} : props;

  return (
    <section
      id="top"
      ref={sectionRef}
      onMouseMove={onMouseMove}
      className="relative flex min-h-[100svh] flex-col overflow-hidden"
    >
      {/* ── Background: event audience + parallax ── */}
      <motion.div aria-hidden="true" className="absolute -inset-x-4 inset-0" style={reduced ? undefined : { x: bgX }}>
        <Image
          src="/images/hero-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-[1.06] object-cover object-center opacity-60"
        />
      </motion.div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/85 via-[#0a0a0f]/30 to-[#0a0a0f]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,15,0.6)_100%)]" />

      {/* ── فاز H — لایه‌های نور سینمایی: دو پرتو راننده + هالهٔ بنفش ── */}
      {!reduced && (
        <>
          <div
            aria-hidden="true"
            className="animate-beam pointer-events-none absolute -top-32 right-[12%] h-[46rem] w-40 opacity-70 blur-2xl"
            style={{
              background:
                "linear-gradient(to bottom, rgba(232,207,122,0.16), rgba(212,175,55,0.05) 55%, transparent)",
            }}
          />
          <div
            aria-hidden="true"
            className="animate-beam-late pointer-events-none absolute -top-40 left-[8%] h-[42rem] w-32 opacity-60 blur-2xl"
            style={{
              background:
                "linear-gradient(to bottom, rgba(123,77,223,0.22), rgba(123,77,223,0.06) 55%, transparent)",
            }}
          />
        </>
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-purple/[0.13] blur-[130px]"
      />

      {/* ── فاز H — گرین فیلم (بافت نویز ظریف) ── */}
      <div aria-hidden="true" className="film-grain absolute inset-0" />

      <AmbientParticles />

      {/* ── Main hero grid ── */}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-4 pb-10 pt-28 sm:px-6 md:pt-32 lg:grid-cols-2 lg:gap-4">
        {/* Floating golden logo — first column → renders on the RIGHT (RTL) */}
        <div className="relative order-2 hidden justify-center lg:order-1 lg:flex">
          <motion.div
            {...anim({
              initial: { opacity: 0, scale: 0.7, rotate: -10 },
              animate: { opacity: 1, scale: 1, rotate: 0 },
              transition: { duration: 1.4, delay: 0.25, ease: easeOut },
            })}
            className="relative"
            style={reduced ? undefined : { rotateX: triRotateX, rotateY: triRotateY, x: triX, y: triY, transformPerspective: 1100 }}
          >
            {/* idle float */}
            <motion.div
              {...(reduced
                ? {}
                : {
                    animate: { y: [0, -16, 0] },
                    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                  })}
              className="relative"
            >
              {/* pulsing aura behind the logo */}
              <motion.div
                aria-hidden="true"
                {...(reduced
                  ? {}
                  : {
                      animate: { opacity: [0.45, 0.85, 0.45], scale: [1, 1.15, 1] },
                      transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
                    })}
                className="absolute inset-8 rounded-full bg-[radial-gradient(circle,rgba(232,207,122,0.4),rgba(212,175,55,0.14)_45%,transparent_70%)] blur-2xl"
              />
              <Image
                src="/images/logo-gold.png"
                alt="لوگوی طلایی آواهاب ایونتس"
                width={657}
                height={625}
                priority
                sizes="(min-width: 1280px) 440px, 36vw"
                className="relative w-[300px] xl:w-[400px] drop-shadow-[0_0_45px_rgba(212,175,55,0.35)]"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Copy — second column → LEFT side like the concept board */}
        <motion.div
          {...(reduced
            ? {}
            : {
                initial: "hidden",
                animate: "show",
                variants: {
                  hidden: {},
                  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
                },
              })}
          style={reduced ? undefined : { x: textX }}
          className="order-1 lg:order-2"
        >
          <motion.p
            {...(reduced
              ? {}
              : {
                  variants: {
                    hidden: { opacity: 0, y: 22 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: easeOut } },
                  },
                })}
            className="mb-5 text-[11px] font-bold tracking-[0.35em] text-gold-soft/90 sm:text-xs"
            dir="ltr"
          >
            EVENT &amp; PROMOTION PLATFORM
          </motion.p>

          <motion.h1
            {...(reduced
              ? {}
              : {
                  variants: {
                    hidden: { opacity: 0, y: 30 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: easeOut } },
                  },
                })}
            className="text-4xl font-black leading-[1.35] sm:text-5xl md:text-6xl xl:text-[4.2rem] xl:leading-[1.28]"
          >
            اینجا ایده‌های شما
            <br />
            <span className="text-gradient-gold">تبدیل به تجربه می‌شود</span>
          </motion.h1>

          <motion.p
            {...(reduced
              ? {}
              : {
                  variants: {
                    hidden: { opacity: 0, y: 26 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: easeOut } },
                  },
                })}
            className="mt-6 max-w-xl text-base leading-8 text-foreground/70 sm:text-lg sm:leading-9"
          >
            آواهاب ایونت؛ از ایده تا اجرا کنار شماست — برگزاری رویداد، پروموشن
            و برندسازی، همه در یک خانه با تیم فنی خودمان
          </motion.p>

          <motion.div
            {...(reduced
              ? {}
              : {
                  variants: {
                    hidden: { opacity: 0, y: 24 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.85, ease: easeOut } },
                  },
                })}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/events"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-base font-bold text-primary-foreground shadow-[0_0_35px_rgba(212,175,55,0.28)] transition-all hover:shadow-[0_0_55px_rgba(212,175,55,0.45)]"
            >
              مشاهده رویدادها
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card/40 px-7 py-3 text-base font-medium text-foreground/90 backdrop-blur transition-all hover:border-primary/50 hover:text-primary"
            >
              خدمات ما
            </Link>
            <button
              type="button"
              onClick={() => setTeaserOpen(true)}
              className="group inline-flex items-center gap-3 rounded-full py-2 pl-3 pr-2 text-sm font-medium text-foreground/80 transition-colors hover:text-gold"
            >
              <span className="relative inline-flex size-11 items-center justify-center rounded-full border border-gold/50 bg-gold/10 transition-all group-hover:scale-110 group-hover:bg-gold/20">
                <span
                  aria-hidden="true"
                  className={`absolute inset-0 rounded-full border border-gold/40 ${reduced ? "" : "animate-ping opacity-40"}`}
                />
                <Play className="size-4 fill-gold text-gold" aria-hidden="true" />
              </span>
              پخش تیزر
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* scroll hint */}
      <motion.a
        href="#services"
        aria-label="اسکرول به پایین"
        className="absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 text-foreground/40 transition-colors hover:text-gold md:block"
        {...(reduced
          ? {}
          : {
              animate: { y: [0, 8, 0] },
              transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            })}
      >
        <ChevronDown className="size-6" aria-hidden="true" />
      </motion.a>

      {/* ── Teaser dialog ── */}
      {teaserOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="پخش تیزر آواهاب"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setTeaserOpen(false)}
        >
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-gold/25 bg-charcoal p-10 text-center shadow-[0_0_80px_rgba(212,175,55,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setTeaserOpen(false)}
              aria-label="بستن"
              className="absolute left-4 top-4 inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground/60 transition-colors hover:border-gold/50 hover:text-gold"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
              <Play className="size-8 fill-gold text-gold" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-black sm:text-2xl">تیزر رسمی آواهاب ایونتس</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-foreground/60">
              ویدیوی معرفی پلتفرم به‌زودی همین‌جا منتشر می‌شود. تا آن زمان،
              رویدادهای پیش رو را از دست ندهید.
            </p>
            <Link
              href="/events"
              onClick={() => setTeaserOpen(false)}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-shadow hover:shadow-[0_0_40px_rgba(212,175,55,0.4)]"
            >
              مشاهده رویدادها
            </Link>
          </motion.div>
        </div>
      )}
    </section>
  );
}
