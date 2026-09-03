import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────
// Middleware:
// ۱) تازه‌سازی توکن نشست در هر درخواست
// ۲) محافظت از مسیرهای خصوصی (/account و /admin)
// ۳) فاز G — ریدایرکت‌های ۳۰۱/۳۰۲ از پنل ادمین (کش ۶۰ ثانیه‌ای)
// اگر env های سونابیس تنظیم نشده باشند، بدون خطا رد می‌شود (فاز ۰)
// ─────────────────────────────────────────────────────────────

const PROTECTED = ["/account", "/admin"];

// ── ریدایرکت‌ها: کش درون‌حافظه‌ای سبک ──
type RedirectMap = Record<string, { to: string; status: number }>;
let redirectCache: { map: RedirectMap; at: number } | null = null;
const REDIRECT_TTL = 60_000;

async function getRedirectMap(origin: string): Promise<RedirectMap> {
  if (redirectCache && Date.now() - redirectCache.at < REDIRECT_TTL) return redirectCache.map;
  try {
    const res = await fetch(`${origin}/api/redirects`, {
      cache: "no-store",
      headers: { "x-internal": "1" },
    });
    if (res.ok) {
      const map = (await res.json()) as RedirectMap;
      redirectCache = { map, at: Date.now() };
      return map;
    }
  } catch {
    // دیتابیس در دسترس نیست — بدون ریدایرکت ادامه بده
  }
  return redirectCache?.map ?? {};
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── فاز G: ریدایرکت‌های ادمین (مستقل از سونابیس؛ خودِ /api مستثنا) ──
  if (!pathname.startsWith("/api/") && !pathname.startsWith("/_next")) {
    const map = await getRedirectMap(request.nextUrl.origin);
    const hit = map[pathname];
    if (hit && hit.to) {
      const dest = /^https?:\/\//i.test(hit.to)
        ? new URL(hit.to)
        : new URL(hit.to, request.nextUrl.origin);
      return NextResponse.redirect(dest, hit.status === 302 ? 302 : 301);
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
