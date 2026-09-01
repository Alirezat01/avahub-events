"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={loading}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-full border border-red-500/40 px-5 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
      }
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <LogOut className="size-4" aria-hidden="true" />}
      خروج از حساب
    </button>
  );
}
