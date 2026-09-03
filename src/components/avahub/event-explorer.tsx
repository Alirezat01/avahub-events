"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { EventCard } from "./event-card";
import type { EventCardData, CategoryData } from "@/lib/avahub/events-db";

/**
 * Event explorer — جستجوی زنده + فیلتر دسته‌بندی (فاز ۳)
 * داده از دیتابیس به‌صورت props وارد می‌شود.
 */
export function EventExplorer({
  events,
  categories,
}: {
  events: EventCardData[];
  categories: CategoryData[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("همه");
  const reduced = useReducedMotion();

  const filterItems = ["همه", ...categories.map((c) => c.title)];

  const filtered = useMemo(() => {
    const q = query.trim();
    return events.filter((event) => {
      const matchCategory = category === "همه" || event.category === category;
      const matchQuery =
        q === "" ||
        event.title.includes(q) ||
        (event.summary ?? "").includes(q) ||
        event.venueName?.includes(q) ||
        event.venueCity.includes(q) ||
        event.category.includes(q);
      return matchCategory && matchQuery;
    });
  }, [events, query, category]);

  return (
    <div>
      {/* Search + filters */}
      <div className="mb-10 flex flex-col items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search
            className="absolute right-4 top-1/2 size-4.5 -translate-y-1/2 text-foreground/40"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی رویدادها..."
            aria-label="جستجوی رویدادها"
            className="w-full rounded-full border border-border bg-card/70 py-3 pl-4 pr-11 text-sm text-foreground placeholder:text-foreground/35 focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="فیلتر دسته‌بندی">
          {filterItems.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={active}
                className={`rounded-full border px-4 py-1.5 text-sm transition-all duration-300 ${
                  active
                    ? "border-gold/60 bg-gold/15 text-gold shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                    : "border-border bg-card/50 text-foreground/60 hover:border-gold/30 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <motion.div layout className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((event, i) => (
              <motion.div
                key={event.slug}
                layout
                initial={reduced ? false : { opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, scale: 0.92, y: -12 }}
                transition={{ duration: 0.4, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                <EventCard event={event} index={0} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border py-20 text-center">
          <p className="text-lg font-bold text-foreground/60">رویدادی پیدا نشد</p>
          <p className="mt-2 text-sm text-foreground/40">
            عبارت دیگری جستجو کنید یا فیلتر را تغییر دهید.
          </p>
        </div>
      )}
    </div>
  );
}
