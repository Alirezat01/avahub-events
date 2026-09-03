#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// فاز J — نویسندهٔ هوش مصنوعی مجلهٔ آواهاب
// اجرا توسط GitHub Action (هفتگی + دستی):
//   ۱) یک موضوع از topics.json را بر اساس شمارهٔ هفته انتخاب می‌کند
//   ۲) با Gemini مقالهٔ فارسی سئوشده تولید می‌کند (خروجی JSON ساختاریافته)
//   ۳) کاور را از تصاویر آمادهٔ برند انتخاب می‌کند
//   ۴) مقاله را با توکن به /api/journal/auto-publish سایت می‌فرستد (پیش‌فرض: DRAFT)
// Secrets لازم روی GitHub:
//   GEMINI_API_KEY ، PUBLISH_TOKEN ، SITE_URL (یا variable به همین نام)
// ─────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PUBLISH_TOKEN = process.env.PUBLISH_TOKEN;
const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
const FORCE_STATUS = (process.env.AI_POST_STATUS || "DRAFT").toUpperCase() === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
const MANUAL_TOPIC = process.env.AI_TOPIC || "";

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

// ── انتخاب موضوع — چرخشی بر اساس هفتهٔ سال (یا موضوع دستی) ──
function pickTopic() {
  const { topics } = JSON.parse(readFileSync(join(__dirname, "topics.json"), "utf8"));
  if (MANUAL_TOPIC) {
    const found = topics.find((t) => t.theme === MANUAL_TOPIC);
    if (found) return { topic: found, index: topics.indexOf(found) };
    log(`موضوع دستی در فهرست نبود؛ موضوع آزاد استفاده می‌شود`);
    return { topic: { theme: MANUAL_TOPIC, category: "رویدادها", keywords: [] }, index: 0 };
  }
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const index = week % topics.length;
  return { topic: topics[index], index };
}

// ── فراخوانی Gemini (REST — بدون SDK) ──
async function generateArticle(topic) {
  if (!GEMINI_API_KEY) fail("GEMINI_API_KEY تنظیم نشده است (GitHub Secret)");

  const prompt = `تو سردبیر ارشد محتوای فارسی «آواهاب ایونتس» هستی؛ پلتفرم برگزاری رویداد، همایش و کنفرانس در تهران (زیرمجموعهٔ مؤسسه فرهنگی هنری آوای شباهنگ).

یک مقالهٔ وبلاگ کامل و حرفه‌ای دربارهٔ موضوع زیر بنویس:
«${topic.theme}»

قواعد سخت:
- زبان: فارسی روان، حرفه‌ای و کاربردی؛ بدون کلیشه و بدون اغراق تبلیغاتی
- طول: ۹۰۰ تا ۱۳۰۰ کلمه
- ساختار Markdown: با «## » شروع کن (بدون تکرار عنوان اصلی در H1)، زیربخش‌های «### »، در صورت نیاز لیست و جدول
- یک بار به‌طور طبیعی از توانایی‌های آواهاب (ثبت‌حضور آنلاین رایگان با QR، برگزاری و پروموشن رویداد) نام ببر؛ لینک نده
- در پایان یک بخش «### جمع‌بندی» بنویس
- Keywords هدف که باید طبیعی در متن بیایند: ${topic.keywords.join(" ، ") || "مرتبط با موضوع"}
- اسلاگ URL: لاتین، کوتاه، با خط تیره، فقط حروف کوچک انگلیسی و عدد

خروجی را فقط و فقط به صورت JSON معتبر با این ساختار بده (بدون markdown code fence):
{
  "title": "عنوان جذاب ۵۰ تا ۷۰ کاراکتری",
  "slug": "latin-slug-example",
  "excerpt": "خلاصهٔ ۱۴۰ تا ۱۶۰ کاراکتری برای کارت مجله",
  "category": "یکی از این چهار: ${ALLOWED_CATEGORIES.join(" | ")}",
  "tags": ["۴ تا ۶ برچسب فارسی"],
  "seoTitle": "عنوان سئو حداکثر ۶۰ کاراکتر",
  "seoDescription": "توضیح سئو ۱۳۰ تا ۱۶۰ کاراکتر",
  "contentMarkdown": "متن کامل مقاله با Markdown"
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    const t = await res.text();
    fail(`Gemini API خطا داد (${res.status}): ${t.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) fail("پاسخ خالی از Gemini");

  let article;
  try {
    article = JSON.parse(text);
  } catch {
    // بعضی مواقع مدل JSON را داخل ``` می‌گذارد
    const cleaned = String(text).replace(/^```(json)?/m, "").replace(/```$/m, "").trim();
    article = JSON.parse(cleaned);
  }

  for (const field of ["title", "slug", "contentMarkdown"]) {
    if (!article[field]) fail(`فیلد ${field} در خروجی Gemini نبود`);
  }
  if (!ALLOWED_CATEGORIES.includes(article.category)) article.category = topic.category || "رویدادها";
  return article;
}

// ── ارسال به سایت ──
async function publish(article, cover) {
  if (!SITE_URL) fail("SITE_URL تنظیم نشده (GitHub Variable یا Secret)");
  if (!PUBLISH_TOKEN) fail("PUBLISH_TOKEN تنظیم نشده (GitHub Secret)");

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
      authorName: "دستیار هوش مصنوعی آواهاب",
      status: FORCE_STATUS,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) {
    fail(`انتشار ناموفق (${res.status}): ${JSON.stringify(body).slice(0, 300)}`);
  }
  return body;
}

// ── main ──
const { topic, index } = pickTopic();
log(`موضوع هفته: ${topic.theme}`);

const article = await generateArticle(topic);
log(`مقاله تولید شد: «${article.title}» (${article.contentMarkdown.length} کاراکتر)`);

const cover = COVERS[index % COVERS.length];
const result = await publish(article, cover);
log(`✅ با موفقیت ارسال شد — slug: ${result.slug} | status: ${result.status}`);
log(`بازبینی: ${SITE_URL}/admin/journal`);

// خلاصه برای GitHub Step Summary
const summary = [
  `## 🤖 مقالهٔ جدید مجلهٔ آواهاب`,
  ``,
  `- **عنوان:** ${article.title}`,
  `- **اسلاگ:** \`${result.slug}\``,
  `- **دسته:** ${article.category}`,
  `- **وضعیت:** ${result.status === "PUBLISHED" ? "منتشر شد" : "پیش‌نویس (نیازمند تأیید ادمین)"}`,
  `- **لینک:** ${result.status === "PUBLISHED" ? `${SITE_URL}/journal/${result.slug}` : `${SITE_URL}/admin/journal`}`,
].join("\n");
console.log(`::add-mask::false`);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
