import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────
// /auth/callback — تبادل کد با نشست
// (بازگشت از گوگل OAuth و لینک‌های ایمیل با کد)
// ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
