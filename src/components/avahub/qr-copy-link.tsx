"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// دکمهٔ کپی لینک ثبت‌نام — فاز ۵ب (QR رویداد)
// لینک مطلق از سرور می‌آید (دامنهٔ فعلی)، این فقط کپی می‌کند.
// ─────────────────────────────────────────────────────────────

export function QrCopyLink({ url }: { url: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState("ok");
    } catch {
      // لینک روی صفحه هست؛ فقط بازخورد بده
      setState("fail");
    }
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-xl border border-white/15 px-3.5 py-2 text-xs font-bold transition hover:bg-white/5"
    >
      {state === "ok" ? "✓ کپی شد" : state === "fail" ? "کپی نشد" : "کپی لینک ثبت‌نام"}
    </button>
  );
}
