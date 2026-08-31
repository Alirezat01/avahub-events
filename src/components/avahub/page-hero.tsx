import { Reveal } from "./reveal";

/**
 * Shared cinematic banner for inner pages — ambient glows + title block.
 */
export function PageHero({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
}) {
  return (
    <section className="relative overflow-hidden pb-12 pt-32 sm:pb-16 sm:pt-40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-6rem] h-72 w-[44rem] max-w-full -translate-x-1/2 rounded-full bg-purple/15 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[10%] top-16 h-40 w-40 rounded-full bg-gold/10 blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px gold-line"
      />
      <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        {eyebrow && (
          <p className="mb-3 text-[11px] font-bold tracking-[0.35em] text-gold-soft/90 sm:text-xs">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-black leading-[1.35] sm:text-5xl sm:leading-[1.3]">
          {title}
        </h1>
        <div aria-hidden="true" className="mx-auto mt-5 h-px w-24 gold-line" />
        {sub && (
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-foreground/60 sm:text-base sm:leading-8">
            {sub}
          </p>
        )}
      </Reveal>
    </section>
  );
}
