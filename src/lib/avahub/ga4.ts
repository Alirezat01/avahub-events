// ─────────────────────────────────────────────────────────────
// GA4 Data API — فاز L (آمار بازدید واقعی سایت در پنل ادمین)
//
// متغیرهای محیطی (در Vercel → Settings → Environment Variables):
//   GA4_PROPERTY_ID    مثال: 123456789  (Admin → Property Settings)
//   GA4_CLIENT_EMAIL   ایمیل سرویس‌اکانت گوگل‌کلاود
//   GA4_PRIVATE_KEY    کلید خصوصی JSON (n\ های Escape شده هم پذیرفته می‌شود)
//
// اگر تنظیم نباشد → { configured:false } و پنل کارت راهنما نشان می‌دهد.
// هر خطایی به پیام کوتاه فارسی تبدیل می‌شود تا صفحهٔ آمار نشکند.
// ─────────────────────────────────────────────────────────────

import { createSign } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const API_BASE = "https://analyticsdata.googleapis.com/v1beta";

export type Ga4Overview =
  | { configured: false }
  | { error: string }
  | {
      data: {
        activeUsers: number;
        sessions: number;
        pageViews: number;
        pages: { path: string; views: number }[];
      };
    };

let cachedToken: { value: string; exp: number } | null = null;

function b64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

/** JWT سرویس‌اکانت → توکن دسترسی گوگل (با کش در حافظه) */
async function accessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.value;

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3300,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = signer
    .sign(privateKey.replace(/\\n/g, "\n"))
    .toString("base64url");
  const jwt = `${header}.${claims}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`OAUTH_${res.status}`);
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("OAUTH_NO_TOKEN");
  cachedToken = { value: json.access_token, exp: now + (json.expires_in ?? 3600) };
  return json.access_token;
}

type RunReportResponse = {
  totals?: { metricValues?: { value?: string }[] }[];
  rows?: {
    dimensionValues?: { value?: string }[];
    metricValues?: { value?: string }[];
  }[];
};

async function runReport(
  propertyId: string,
  token: string,
  body: object,
): Promise<RunReportResponse> {
  const res = await fetch(`${API_BASE}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as RunReportResponse & {
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(json.error?.message ?? `GA4_${res.status}`);
  return json;
}

/** خلاصهٔ بازدید سایت — ۲۸ روز اخیر */
export async function ga4Overview(): Promise<Ga4Overview> {
  const propertyId = (process.env.GA4_PROPERTY_ID ?? "").trim();
  const clientEmail = (process.env.GA4_CLIENT_EMAIL ?? "").trim();
  const privateKey = (process.env.GA4_PRIVATE_KEY ?? "").trim();
  if (!propertyId || !clientEmail || !privateKey) return { configured: false };

  try {
    const token = await accessToken(clientEmail, privateKey);

    const range = { startDate: "28daysAgo", endDate: "today" };
    const [totals, pages] = await Promise.all([
      runReport(propertyId, token, {
        dateRanges: [range],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
        limit: 1,
      }),
      runReport(propertyId, token, {
        dateRanges: [range],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 6,
      }),
    ]);

    const t = totals.totals?.[0]?.metricValues?.map((m) => Number(m.value ?? "0")) ?? [];
    const pageRows = (pages.rows ?? []).map((r) => ({
      path: r.dimensionValues?.[0]?.value ?? "/",
      views: Number(r.metricValues?.[0]?.value ?? "0"),
    }));

    return {
      data: {
        activeUsers: t[0] ?? 0,
        sessions: t[1] ?? 0,
        pageViews: t[2] ?? 0,
        pages: pageRows,
      },
    };
  } catch (e) {
    const raw = e instanceof Error ? e.message : "GA4_ERROR";
    const low = raw.toLowerCase();
    if (raw.includes("401") || low.includes("unauthenticated") || low.includes("invalid_grant"))
      return { error: "احراز هویت گوگل رد شد — ایمیل و کلید خصوصی سرویس‌اکانت را بررسی کنید." };
    if (raw.includes("403") || low.includes("permission") || low.includes("denied"))
      return { error: "سرویس‌اکانت به ملک GA4 دسترسی ندارد — ایمیل آن را با نقش Viewer در Property Access Management اضافه کنید." };
    if (raw.includes("404") || low.includes("not found"))
      return { error: "ملک GA4 پیدا نشد — GA4_PROPERTY_ID را بررسی کنید." };
    return { error: raw };
  }
}
