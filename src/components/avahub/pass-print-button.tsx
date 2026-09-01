"use client";

import { Printer } from "lucide-react";

// دکمهٔ چاپ کارت ورود — چاپ تمیز فقط بلیت (هدر/فوتر سایت حذف می‌شود)
export function PassPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-black text-charcoal transition-shadow hover:shadow-[0_0_35px_rgba(212,175,55,0.4)]"
    >
      <Printer className="size-4" aria-hidden="true" />
      چاپ کارت ورود
    </button>
  );
}
