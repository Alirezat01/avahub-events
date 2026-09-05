#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// فاز O — پرکردن کاور مقاله‌های قدیمی مجله با تصویر AI
// اجرا: دستی از تب Actions (ورک‌فلوی «AI Journal Cover Backfill»)
// جریان:
//   ۱) مقالات اخیر از GET auto-publish خوانده می‌شود
//   ۲) فقط مقاله‌های «بدون کاور واقعی» پردازش می‌شوند
//   ۳) برای هرکدام Gemini یک توصیف انگلیسی صحنه می‌سازد
//   ۴) کاور با Pollinations تولید و به سایت آپلود می‌شود
//   ۵) با PATCH auto-publish فقط فیلد کاور مقاله به‌روز می‌شود
// هیچ چیز دیگری از مقاله دست نمی‌خورد؛ خطای تک‌مقاله بقیه را نمی‌شکند.
// ─────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PUBLISH_TOKEN = process.env.PUBLISH_TOKEN;
const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-3.6-flash").trim();
const IMAGE_MODEL = (process.env.IMAGE_MODEL || "flux").trim();
const MODEL_CANDIDATES = [...new Set([GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash"])];

function log(msg) {
  console.log(`[backfill-covers] ${msg}`);
}

function fail(msg) {
  console.error(`[backfill-covers] ❌ ${msg}`);
  process.exit(1);
}

async function geminiText(prompt) {
  for (const model of MODEL_CANDIDATES) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
          }),
          signal: AbortSignal.timeout(90_000),
        }
      );
      if (!r.ok) {
        if (r.status === 404) continue; // مدل بازنشسته → بعدی
        throw new Error(`HTTP ${r.status}`);
      }
      const data = await r.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text;
    } catch (err) {
      log(`⚠ Gemini (${model}) خطا: ${err.message}`);
    }
  }
  return null;
}

async function makeCoverUrl(title, slug) {
  const scene = await geminiText(
    `Describe ONE photorealistic cover image for a Persian magazine article titled «${title}» (event industry: conferences, concerts, brand activations, networking). Answer with ONLY the English image description (one sentence, max 40 words): the concrete scene, subject, camera feel. Absolutely no text/letters/watermark in the image.`
  );
  const safeScene =
    (scene && scene.replace(/\s+/g, " ").slice(0, 400)) ||
    "modern professional event scene, conference stage and audience";
  const style =
    " dark elegant mood, deep purple (#7B4DDF) and warm gold (#D4AF37) lighting accents, " +
    "photorealistic, cinematic depth of field, 16:9, no text, no letters, no watermark";
  const url =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(`${safeScene}${style}`) +
    `?width=1280&height=720&nologo=true&model=${encodeURIComponent(IMAGE_MODEL)}&seed=${Math.floor(Math.random() * 1_000_000)}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(150_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 5_000) throw new Error("تصویر خراب بود");

      const up = await fetch(`${SITE_URL}/api/media/ai-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publish-token": PUBLISH_TOKEN },
        body: JSON.stringify({ dataBase64: buf.toString("base64"), filename: `ai-cover-${slug}.jpg` }),
        signal: AbortSignal.timeout(60_000),
      });
      const body = await up.json().catch(() => ({}));
      if (!up.ok || !body.ok || !body.url) throw new Error(`آپلود: ${JSON.stringify(body).slice(0, 150)}`);
      return body.url;
    } catch (err) {
      log(`⚠ تولید/آپلود کاور تلاش ${attempt} ناموفق: ${err.message}`);
    }
  }
  return null;
}

// ── main ──
if (!GEMINI_API_KEY) fail("GEMINI_API_KEY تنظیم نشده است");
if (!SITE_URL) fail("SITE_URL تنظیم نشده است");
if (!PUBLISH_TOKEN) fail("PUBLISH_TOKEN تنظیم نشده است");

const r = await fetch(`${SITE_URL}/api/journal/auto-publish`, {
  headers: { "x-publish-token": PUBLISH_TOKEN },
  signal: AbortSignal.timeout(30_000),
});
if (!r.ok) fail(`خواندن مقالات ناموفق بود (HTTP ${r.status})`);
const { posts } = await r.json();

const targets = (posts || []).filter((p) => {
  const c = String(p.coverImage || "");
  return !c.startsWith("http") && !c.startsWith("/images/");
});

if (!targets.length) {
  log("همهٔ مقاله‌ها کاور واقعی دارند — کاری برای انجام نیست ✅");
  process.exit(0);
}
log(`${targets.length} مقالهٔ بدون کاور پیدا شد…`);

let done = 0;
for (const post of targets) {
  log(`— «${post.title}» (${post.slug})`);
  const cover = await makeCoverUrl(post.title, post.slug);
  if (!cover) {
    log(`⚠ رد شد (کاور ساخته نشد): ${post.slug}`);
    continue;
  }
  const patch = await fetch(`${SITE_URL}/api/journal/auto-publish`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-publish-token": PUBLISH_TOKEN },
    body: JSON.stringify({ slug: post.slug, coverImage: cover }),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await patch.json().catch(() => ({}));
  if (!patch.ok || !body.ok) {
    log(`⚠ ذخیرهٔ کاور ناموفق: ${post.slug} — ${JSON.stringify(body).slice(0, 150)}`);
    continue;
  }
  done++;
  log(`✅ کاور ذخیره شد: ${post.slug}`);
  await new Promise((res) => setTimeout(res, 3_000)); // مکث مودبانه بین تصاویر
}

log(`تمام شد — ${done} از ${targets.length} مقاله کاور جدید گرفت.`);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## 🖼 پرکردن کاورها\n\n- مقاله‌های بدون کاور: ${targets.length}\n- کاور جدید گرفته: ${done}`
  );
}
