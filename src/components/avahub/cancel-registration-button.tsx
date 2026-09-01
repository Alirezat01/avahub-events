"use client";

// دکمه انصراف از رویداد — با تأیید و حالت لودینگ

import { useState, useTransition } from "react";
import { Loader2, UserX } from "lucide-react";
import { cancelRegistrationAction } from "@/app/events/[slug]/register/actions";

export function CancelRegistrationButton({
  registrationId,
  eventTitle,
}: {
  registrationId: string;
  eventTitle: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <span className="rounded-full border border-border bg-card/60 px-4 py-1.5 text-[11px] text-foreground/50">
        {message ?? "انصراف ثبت شد"}
      </span>
    );
  }

  const perform = () => {
    startTransition(async () => {
      const res = await cancelRegistrationAction(registrationId);
      setMessage(res.message);
      if (res.ok) setDone(true);
      else setTimeout(() => setMessage(null), 4000);
    });
  };

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-foreground/60">
          از «{eventTitle}» انصراف می‌دهید؟
        </span>
        <button
          type="button"
          onClick={perform}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-red-500/90 px-4 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
          بله، انصراف
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-full border border-border px-4 py-1.5 text-[11px] text-foreground/60 hover:text-foreground"
        >
          بازگشت
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 px-4 py-1.5 text-[11px] font-bold text-red-300 transition-colors hover:bg-red-500/10"
    >
      <UserX className="size-3.5" aria-hidden="true" />
      انصراف از این رویداد
    </button>
  );
}
