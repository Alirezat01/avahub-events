#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// فاز N — نویسندهٔ خودکار مجلهٔ آواهاب (نسخهٔ کامل)
// هر اجرا = یک مقالهٔ کامل با کاورِ اختصاصیِ تولیدی، منتشرشدهٔ مستقیم
// GitHub Action هفته‌ای دو بار (چهارشنبه + شنبه) اجرا می‌کند.
//
// جریان:
//   ۱) مقالات اخیر سایت خوانده می‌شود (GET auto-publish با توکن)
//   ۲) Gemini یک موضوع «تازه» انتخاب می‌کند (بدون تأیید ادمین؛
//      اگر شکست خورد → چرخش از topics.json بدون موضوعات تکراری)
//   ۳) Gemini مقاله را با ادبیات یک نویسندهٔ انسانی می‌نویسد
//      + توصیف انگلیسی صحنهٔ کاور (coverPrompt) می‌سازد
//   ۴) کاور از Pollinations (رایگان و بی‌کلید) تولید و به
//      /api/media/ai-upload سایت (باکت media سونابیس) آپلود می‌شود
//      — اگر هر مرحله‌ای از تصویر شکست خورد، کاور استاتیک برند
//      جایگزین می‌شود و مقاله هیچ‌وقت به‌خاطر عکس از دست نمی‌رود
//   ۵) مقاله به /api/journal/auto-publish فرستاده می‌شود
//
// Secrets لازم روی GitHub (بدون تغییر نسبت به قبل):
//   GEMINI_API_KEY ، PUBLISH_TOKEN ، SITE_URL (یا variable به همین نام)
// Variable اختیاری:
//   GEMINI_MODEL — نام مدل (پیش‌فرض: gemini-3.6-flash)
//   IMAGE_MODEL  — مدل تصویر Pollinations (پیش‌فرض: flux)
// ─────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PUBLISH_TOKEN = process.env.PUBLISH_TOKEN;
const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
const FORCE_STATUS = (process.env.AI_POST_STATUS || "PUBLISHED").toUpperCase() === "DRAFT" ? "DRAFT" : "PUBLISHED";
const MANUAL_TOPIC = process.env.AI_TOPIC || "";
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-3.6-flash").trim();
const IMAGE_MODEL = (process.env.IMAGE_MODEL || "flux").trim();
// اگر مدلی بازنشسته شده باشد (404 NOT_FOUND)، خودکار سراغ گزینه‌های بعدی می‌رود
const MODEL_CANDIDATES = [...new Set([GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash"])];

// شنبه = A (راهنمای عملی) | چهارشنبه = B (روایت و تحلیل)
const UTC_DOW = new Date().getUTCDay(); // 3 = Wednesday, 6 = Saturday
const SLOT = UTC_DOW === 3 ? "B" : "A";

const COVERS = [
  "/images/event-conference.png",
  "/images/event-seminar.png",
  "/images/event-workshop.png",
  "/images/event-panel.png",
  "/images/event-showcase.png",
  "/images/about-backstage.png",
];

const ALLOWED_CATEGORIES = ["رویدادها", "برندسازی", "تولید محتوا", "تبلیغات"];

function log(msg) {
  console.log(`[ai-journal] ${msg}`);
}

function fail(msg) {
  console.error(`[ai-journal] ❌ ${msg}`);
  process.exit(1);
}

// ── Gemini REST (مشترک بین انتخاب موضوع و نوشتن مقاله) ──
async function geminiJson(prompt, { temperature = 0.8, maxTokens = 16384, label = "gemini" } = {}) {
  let res = null;
  let lastErr = "";
  for (const model of MODEL_CANDIDATES) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(180_000),
      }
    );
    if (r.ok) {
      res = r;
      break;
    }
    const t = await r.text();
    lastErr = `(${r.status}) ${t.slice(0, 300)}`;
    if (r.status === 404 || /NOT_FOUND|no longer available|is not supported|not found/i.test(t)) {
      log(`مدل «${model}» در دسترس نیست؛ سراغ مدل بعدی می‌رویم…`);
      continue;
    }
    throw new Error(`${label} خطا داد ${lastErr}`);
  }
  if (!res) throw new Error(`${label}: هیچ‌کدام از مدل‌ها پاسخ ندادند — ${lastErr}`);

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`${label}: پاسخ خالی بود`);

  try {
    return JSON.parse(text);
  } catch {
    const cleaned = String(text).replace(/^```(json)?/m, "").replace(/```$/m, "").trim();
    return JSON.parse(cleaned);
  }
}

// ── ۱) مقالات اخیر سایت (برای تکرارنشدن موضوع) ──
async function fetchRecentPosts() {
  try {
    const r = await fetch(`${SITE_URL}/api/journal/auto-publish`, {
      headers: { "x-publish-token": PUBLISH_TOKEN },
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) return [];
    const body = await r.json();
    return Array.isArray(body.posts) ? body.posts : [];
  } catch {
    return [];
  }
}

// ── ۲) انتخاب موضوع — Gemini خودش تازه انتخاب می‌کند ──
async function pickTopicAI(recentPosts) {
  if (MANUAL_TOPIC) {
    return {
      theme: MANUAL_TOPIC,
      category: "رویدادها",
      keywords: [],
      angle: MANUAL_TOPIC,
    };
  }

  const recent = recentPosts
    .slice(0, 25)
    .map((p) => `- ${p.title}`)
    .join("\n");

  const slotBrief =
    SLOT === "A"
      ? "یک موضوع «راهنمای عملی و کاربردی» (چک‌لیست، گام‌به‌گام، هزینه و بودجه‌بندی، اشتباه‌های رایج)"
      : "یک موضوع «روایی و تحلیلی» (ترندها، روایت برند، تجربهٔ مخاطب، روان‌شناسی رویداد، آیندهٔ صنعت)";

  const prompt = `تو سردبیر مجلهٔ «آواهاب ایونتس» هستی؛ پلتفرم برگزاری رویداد، همایش و کنفرانس در تهران (زیرمجموعهٔ مؤسسه فرهنگی هنری آوای شباهنگ). مخاطب مجله: مدیران بازاریابی، برندها، سازمان‌ها و آدم‌های صنعت رویداد ایران.

امروز یک «موضوع کاملاً تازه» برای مقالهٔ هفتگی انتخاب کن. ${slotBrief}.

موضوع نباید هم‌پوشانی معنایی با این مقالات قبلی داشته باشد:
${recent || "(هنوز مقاله‌ای نیست)"}

حوزه‌های مجاز: برگزاری رویداد و همایش، نمایشگاه و اکتیویشن برند، شبکه‌سازی و ارتباطات، برندسازی، تولید محتوا، تبلیغات و جذب مخاطب، فناوری رویداد (ثبت‌حضور QR، اپ، هایبرید)، بودجه و مذاکره با سالن و پیمانکار، سنجش بازگشت سرمایهٔ رویداد.

موضوع باید برای کسب‌وکارهای ایرانی مفید، جستجوشده در گوگل، و به‌اندازهٔ یک مقالهٔ ۱۰۰۰ کلمه‌ای باریک و مشخص باشد (نه کلی مثل «اهمیت رویدادها»).

خروجی فقط JSON:
{
  "theme": "عنوان موضوع به فارسی (جملهٔ توصیفی، نه عنوان نهایی مقاله)",
  "category": "یکی از: ${ALLOWED_CATEGORIES.join(" | ")}",
  "keywords": ["۳ تا ۵ کیورد فارسی که مخاطب در گوگل جستجو می‌کند"],
  "angle": "در یک جمله: زاویهٔ دید خاص این مقاله"
}`;

  const out = await geminiJson(prompt, { temperature: 1.0, maxTokens: 2048, label: "انتخاب موضوع" });
  if (!out?.theme) throw new Error("موضوع انتخاب‌شده نامعتبر بود");
  if (!ALLOWED_CATEGORIES.includes(out.category)) out.category = "رویدادها";
  if (!Array.isArray(out.keywords)) out.keywords = [];
  return out;
}

// چرخش کلاسیک topics.json به‌عنوان پشتیبان
function pickTopicFallback(recentPosts) {
  const { topics } = JSON.parse(readFileSync(join(__dirname, "topics.json"), "utf8"));
  const recentSet = new Set(recentPosts.map((p) => String(p.title || "").trim()));
  const fresh = topics.filter((t) => !recentSet.has(t.theme));
  const pool = fresh.length ? fresh : topics;
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const index = (week + (SLOT === "B" ? 1 : 0)) % pool.length;
  return { ...pool[index], angle: pool[index].theme };
}

// ── ۳) نوشتن مقاله با ادبیات نویسندهٔ انسانی ──
async function generateArticle(topic) {
  const prompt = `تو «نویسندهٔ ارشد» مجلهٔ آواهاب ایونتس هستی — پلتفرم برگزاری رویداد، همایش و کنفرانس در تهران (زیرمجموعهٔ مؤسسه فرهنگی هنری آوای شباهنگ). سبک تو شبیه ستون‌نویس‌های خوب مجلات کسب‌وکار ایران است: کسی که سال‌ها رویداد برگزار کرده و «از تجربه» می‌نویسد، نه از روی تعریف کتابی.

موضوع مقاله: «${topic.theme}»
زاویهٔ دید: ${topic.angle || topic.theme}

قواعد نویسندگی (سخت و غیرقابل مذاکره):
- فارسی روانِ گفتاری-محترمانه؛ انگار برای یک همکار حرفه‌ای می‌نویسی. جمله‌ها بلندی‌های متفاوت داشته باشند؛ گاهی یک جملهٔ کوتاهِ ضربه‌ای.
- مطلقاً ممنوع: «در دنیای امروز»، «با پیشرفت فناوری»، «بدون شک»، «به جرات می‌توان گفت»، «در این مقاله قصد داریم»، «امیدواریم مفید بوده باشد» و هر کلیشهٔ رباتیک دیگر. شروع را با یکی از این‌ها باز کن: یک آمار یا عدد مشخص، یک صحنهٔ واقعی از پشت صحنهٔ رویداد، یک سؤال مستقیم از خواننده، یا یک اشتباه رایج.
- حداقل دو مثال ملموس ایرانی/تهرانی بیاور (نام خیابان، محدوده، فصل، نوع کسب‌وکار) و حداقل یک عدد یا بازهٔ واقع‌بینانه (هزینه، تعداد مهمان، زمان).
- به‌جای فهرست‌بکی پیوسته، پاراگراف‌های روایی بنویس؛ فقط جاهایی که واقعاً کاربردی است لیست یا جدول بگذار (حداکثر ۲ بار).
- یک بار و به‌طور طبیعی از توانایی آواهاب (ثبت‌حضور آنلاین رایگان با QR و برگزاری و پروموشن رویداد) در جریان تجربهٔ خودت نام ببر؛ تبلیغ نکن، لینک نده.
- لحن: صمیمی-حرفه‌ای، اعتمادبه‌نفس آرام، بدون اغراق و بدون تعارف اضافی. جایی که محدودیت یا هزینهٔ واقعی هست، صادقانه بگو.
- طول: ۹۰۰ تا ۱۳۰۰ کلمه. ساختار Markdown: با «## » شروع کن (H1 ننویس)، زیربخش‌ها با «### »، پایان با «### جمع‌بندی» که یک پیشنهاد مشخصِ قابل‌اجرا به خواننده بدهد.
- Keywords هدف که باید طبیعی در متن بیایند: ${(topic.keywords || []).join(" ، ") || "مرتبط با موضوع"}
- اسلاگ URL: لاتین، کوتاه، با خط تیره، فقط حروف کوچک انگلیسی و عدد.
- coverPrompt: توصیف انگلیسیِ سینماییِ یک تصویر برای کاور همین مقاله (صحنهٔ مرتبط با محتوا؛ بدون هیچ متن و حروف در تصویر).

خروجی فقط JSON:
{
  "title": "عنوان جذاب ۵۰ تا ۷۰ کاراکتری (کنجکاوی‌برانگیز ولی نه کلیکی)",
  "slug": "latin-slug-example",
  "excerpt": "خلاصهٔ ۱۴۰ تا ۱۶۰ کاراکتری که وسط داستان را لو ندهد",
  "category": "یکی از این چهار: ${ALLOWED_CATEGORIES.join(" | ")}",
  "tags": ["۴ تا ۶ برچسب فارسی"],
  "seoTitle": "عنوان سئو حداکثر ۶۰ کاراکتر",
  "seoDescription": "توضیح سئو ۱۳۰ تا ۱۶۰ کاراکتر",
  "coverPrompt": "English cinematic image description, related to the article scene, no text in image",
  "contentMarkdown": "متن کامل مقاله با Markdown"
}`;

  const article = await geminiJson(prompt, { temperature: 0.9, label: "نوشتن مقاله" });
  for (const field of ["title", "slug", "contentMarkdown"]) {
    if (!article[field]) throw new Error(`فیلد ${field} در خروجی Gemini نبود`);
  }
  if (!ALLOWED_CATEGORIES.includes(article.category)) article.category = topic.category || "رویدادها";
  return article;
}

// ── ۴) کاور اختصاصی: تولید با Pollinations + آپلود به سایت ──
async function makeCover(article, fallbackIndex) {
  const scene =
    typeof article.coverPrompt === "string" && article.coverPrompt.trim().length > 20
      ? article.coverPrompt.trim()
      : `professional event photography scene for article: ${article.title}`;

  const style =
    " dark elegant mood, deep purple (#7B4DDF) and warm gold (#D4AF37) stage lighting accents, " +
    "photorealistic, cinematic depth of field, high detail, wide composition 16:9, " +
    "absolutely no text, no letters, no words, no watermark, no logo";

  const seed = Math.floor(Math.random() * 1_000_000);
  const url =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(scene.slice(0, 600) + style) +
    `?width=1280&height=720&nologo=true&model=${encodeURIComponent(IMAGE_MODEL)}&seed=${seed}`;

  // دو تلاش؛ بعدش کاور استاتیک
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      log(`تولید کاور با Pollinations (تلاش ${attempt})…`);
      const r = await fetch(url, { signal: AbortSignal.timeout(150_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 5_000) throw new Error("تصویر خیلی کوچک/خراب بود");

      const up = await fetch(`${SITE_URL}/api/media/ai-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publish-token": PUBLISH_TOKEN },
        body: JSON.stringify({ dataBase64: buf.toString("base64"), filename: `ai-cover-${article.slug}.jpg` }),
        signal: AbortSignal.timeout(60_000),
      });
      const body = await up.json().catch(() => ({}));
      if (!up.ok || !body.ok || !body.url) throw new Error(`آپلود شکست خورد: ${JSON.stringify(body).slice(0, 200)}`);

      log(`کاور AI ساخته و آپلود شد ✓ (${Math.round(buf.length / 1024)}KB)`);
      return body.url;
    } catch (err) {
      console.error(`[ai-journal] ⚠ کاور تلاش ${attempt} ناموفق: ${err.message}`);
    }
  }
  const fallback = COVERS[fallbackIndex % COVERS.length];
  log(`کاور استاتیک برند جایگزین شد: ${fallback}`);
  return fallback;
}

// ── ۵) ارسال به سایت ──
async function publish(article, cover) {
  const res = await fetch(`${SITE_URL}/api/journal/auto-publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publish-token": PUBLISH_TOKEN,
    },
    body: JSON.stringify({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.contentMarkdown,
      category: article.category,
      tags: article.tags,
      coverImage: cover,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      authorName: "تحریریهٔ آواهاب ایونتس",
      status: FORCE_STATUS,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) {
    fail(`انتشار ناموفق (${res.status}): ${JSON.stringify(body).slice(0, 300)}`);
  }
  return body;
}

// ── main ──
if (!GEMINI_API_KEY) fail("GEMINI_API_KEY تنظیم نشده است (GitHub Secret)");
if (!SITE_URL) fail("SITE_URL تنظیم نشده (GitHub Variable یا Secret)");
if (!PUBLISH_TOKEN) fail("PUBLISH_TOKEN تنظیم نشده (GitHub Secret)");

const recentPosts = await fetchRecentPosts();
log(`مقالات اخیر سایت: ${recentPosts.length} مورد — اسلات این هفته: ${SLOT}`);

let topic;
try {
  topic = await pickTopicAI(recentPosts);
  log(`موضوع انتخابی هوشمند: ${topic.theme}`);
} catch (err) {
  console.error(`[ai-journal] ⚠ انتخاب هوشمند موضوع شکست خورد (${err.message})؛ چرخش کلاسیک…`);
  topic = pickTopicFallback(recentPosts);
  log(`موضوع چرخشی: ${topic.theme}`);
}

const article = await generateArticle(topic);
log(`مقاله نوشته شد: «${article.title}» (${article.contentMarkdown.length} کاراکتر)`);

const cover = await makeCover(article, recentPosts.length);
log(`کاور: ${cover.startsWith("http") ? "تولید هوش مصنوعی ✓" : "کتابخانهٔ برند"}`);

const result = await publish(article, cover);
log(`✅ منتشر شد — slug: ${result.slug} | status: ${result.status}`);
log(`${SITE_URL}/journal/${result.slug}`);

// خلاصه برای GitHub Step Summary
const summary = [
  `## 🤖✍️ مقالهٔ جدید مجلهٔ آواهاب`,
  ``,
  `- **عنوان:** ${article.title}`,
  `- **اسلاگ:** \`${result.slug}\``,
  `- **دسته:** ${article.category}`,
  `- **کاور:** ${cover.startsWith("http") ? "تولید هوش مصنوعی" : "کتابخانهٔ برند"}`,
  `- **وضعیت:** ${result.status === "PUBLISHED" ? "منتشر شد ✅" : "پیش‌نویس (نیازمند تأیید ادمین)"}`,
  `- **لینک:** ${result.status === "PUBLISHED" ? `${SITE_URL}/journal/${result.slug}` : `${SITE_URL}/admin/journal`}`,
].join("\n");
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
