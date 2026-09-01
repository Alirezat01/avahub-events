// ─────────────────────────────────────────────────────────────
// ارسال ایمیل تراکنشی با Resend (فاز ۴)
// دامنه avahubevents.com در Resend تأیید شده است.
// اگر RESEND_API_KEY تنظیم نشده باشد، ارسال بی‌صدا رد می‌شود
// تا ثبت‌نام کاربر هرگز به‌خاطر ایمیل شکست نخورد.
// ─────────────────────────────────────────────────────────────

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM = "آواهاب ایونتس <no-reply@avahubevents.com>";

type RegistrationEmailInput = {
  to: string;
  name?: string | null;
  eventTitle: string;
  eventDateFa: string;
  eventTimeFa?: string;
  venue: string;
  kind: "registered" | "waitlisted" | "cancelled";
  eventUrl?: string;
  /** لینک کارت ورود QR — فقط برای kind=registered */
  passUrl?: string;
};

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="fa" dir="rtl">
  <body style="margin:0;padding:24px;background:#0a0a0f;font-family:Tahoma,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#12121a;border:1px solid #2a2a35;border-radius:16px;overflow:hidden;">
      <div style="padding:22px 26px;border-bottom:1px solid #2a2a35;text-align:center;">
        <span style="color:#d4af37;font-weight:bold;font-size:17px;">آواهاب ایونتس</span>
        <span style="color:#7b4ddf;font-weight:bold;font-size:17px;"> AVAHUB EVENTS</span>
      </div>
      <div style="padding:26px;color:#f5f5f0;line-height:2;font-size:14px;">
        ${body}
      </div>
      <div style="padding:16px 26px;border-top:1px solid #2a2a35;color:#8a8a95;font-size:11px;line-height:1.9;">
        این ایمیل به‌دلیل ثبت‌حضور آنلاین در سایت avahubevents.com برای شما ارسال شده است.
      </div>
    </div>
  </body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#9a9aa5;width:96px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;color:#f5f5f0;">${value}</td>
  </tr>`;
}

export async function sendRegistrationEmail(
  input: RegistrationEmailInput,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false; // فاز قبل از تنظیم کلید — بی‌صدا رد می‌شود

  const firstName = (input.name ?? "").split(" ")[0] || "دوست عزیز";
  let subject: string;
  let body: string;

  if (input.kind === "registered") {
    subject = `ثبت‌حضور شما قطعی شد — ${input.eventTitle}`;
    body = `
      <p style="margin:0 0 8px;">${firstName} عزیز، سلام 👋</p>
      <p style="margin:0 0 16px;">ثبت‌حضور شما در رویداد زیر <b style="color:#d4af37;">قطعی</b> شد. منتظر دیدارتان هستیم!</p>
      <table style="width:100%;border-collapse:collapse;background:#0a0a0f;border-radius:12px;padding:14px;">
        ${row("رویداد", input.eventTitle)}
        ${row("زمان", `${input.eventDateFa}${input.eventTimeFa ? ` — ${input.eventTimeFa}` : ""}`)}
        ${row("مکان", input.venue)}
      </table>
      ${input.passUrl ? `<div style="margin:20px 0 4px;text-align:center;"><a href="${input.passUrl}" style="display:inline-block;background:#d4af37;color:#0a0a0f;font-weight:bold;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;">🎫 مشاهده کارت ورود (QR)</a></div><p style="margin:10px 0 0;color:#9a9aa5;font-size:12px;text-align:center;">هنگام ورود کافی است همین کارت را (تصویر یا چاپ‌شده) ارائه کنید.</p>` : ""}
      ${input.eventUrl ? `<p style="margin:16px 0 0;"><a href="${input.eventUrl}" style="color:#d4af37;">جزئیات کامل رویداد را ببینید ←</a></p>` : ""}
      <p style="margin:16px 0 0;color:#9a9aa5;font-size:12px;">برای مشاهده رویدادهای ثبت‌نامی‌تان به بخش «حساب کاربری» در سایت مراجعه کنید. اگر قصد انصراف دارید، از همان‌جا به‌راحتی انصراف بدهید تا جایگاه به نفر بعدی لیست انتظار برسد.</p>`;
  } else if (input.kind === "waitlisted") {
    subject = `در لیست انتظار ثبت شدید — ${input.eventTitle}`;
    body = `
      <p style="margin:0 0 8px;">${firstName} عزیز، سلام 👋</p>
      <p style="margin:0 0 16px;">ظرفیت رویداد زیر تکمیل شده و درخواست شما در <b style="color:#7b4ddf;">لیست انتظار</b> ثبت شد. به‌محض باز شدن یک جایگاه، به‌صورت خودکار به شما اطلاع می‌دهیم.</p>
      <table style="width:100%;border-collapse:collapse;background:#0a0a0f;border-radius:12px;padding:14px;">
        ${row("رویداد", input.eventTitle)}
        ${row("زمان", `${input.eventDateFa}${input.eventTimeFa ? ` — ${input.eventTimeFa}` : ""}`)}
        ${row("مکان", input.venue)}
      </table>`;
  } else {
    subject = `انصراف شما ثبت شد — ${input.eventTitle}`;
    body = `
      <p style="margin:0 0 8px;">${firstName} عزیز، سلام</p>
      <p style="margin:0 0 16px;">انصراف شما از رویداد زیر ثبت شد. امیدواریم در رویدادهای بعدی آواهاب دوباره میزبان شما باشیم.</p>
      <table style="width:100%;border-collapse:collapse;background:#0a0a0f;border-radius:12px;padding:14px;">
        ${row("رویداد", input.eventTitle)}
        ${row("زمان", input.eventDateFa)}
        ${row("مکان", input.venue)}
      </table>
      ${input.eventUrl ? `<p style="margin:16px 0 0;"><a href="${input.eventUrl}" style="color:#d4af37;">رویدادهای دیگر را ببینید ←</a></p>` : ""}`;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [input.to],
        subject,
        html: shell(subject, body),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
