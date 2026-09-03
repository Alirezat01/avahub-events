"use client";

import { useMemo, useState } from "react";

// ─────────────────────────────────────────────────────────────
// فاز G — لینک‌ساز UTM (کلاینت)
// لینک تبلیغاتی بساز، کپی کن، در اینستاگرام/تلگرام بگذار
// ─────────────────────────────────────────────────────────────

type EventOpt = { slug: string; title: string };
type CampaignOpt = {
  id: string;
  name: string;
  utmCampaign: string | null;
  source: string;
  medium: string | null;
};

export function UtmBuilder({
  events,
  campaigns,
}: {
  events: EventOpt[];
  campaigns: CampaignOpt[];
}) {
  const [siteUrl, setSiteUrl] = useState("");
  const [eventSlug, setEventSlug] = useState(events[0]?.slug ?? "");
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");
  const [source, setSource] = useState("instagram");
  const [medium, setMedium] = useState("post");

  const selected = campaigns.find((c) => c.id === campaignId);
  const effCampaign = selected?.utmCampaign ?? "";

  const link = useMemo(() => {
    const base = (siteUrl.trim() || "https://www.avahubevents.com").replace(/\/+$/, "");
    const path = eventSlug ? `/events/${eventSlug}` : "/events";
    const params = new URLSearchParams();
    if (source) params.set("utm_source", source);
    if (medium) params.set("utm_medium", medium);
    if (effCampaign) params.set("utm_campaign", effCampaign);
    const q = params.toString();
    return `${base}${path}${q ? `?${q}` : ""}`;
  }, [siteUrl, eventSlug, source, medium, effCampaign]);

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // کلیپ‌بورد در دسترس نیست
    }
  };

  const inputCls =
    "w-full rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-[#d4af37]/40 focus:outline-none";

  return (
    <div className="rounded-2xl border border-[#d4af37]/25 bg-[#d4af37]/[0.04] p-5">
      <h2 className="mb-1 text-sm font-black">لینک‌ساز UTM</h2>
      <p className="mb-4 text-[11px] leading-5 text-white/45">
        این لینک را در تبلیغ/بایو بگذارید؛ هر ثبت‌نام از روی آن به کمپین وصل می‌شود و جدول پایین
        عملکردش را نشان می‌دهد.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-[10px] font-bold text-white/50">آدرس سایت</label>
          <input
            dir="ltr"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://www.avahubevents.com"
            className={`${inputCls} text-left font-mono`}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold text-white/50">صفحهٔ مقصد</label>
          <select value={eventSlug} onChange={(e) => setEventSlug(e.target.value)} className={inputCls}>
            <option value="">/events (تقویم رویدادها)</option>
            {events.map((e) => (
              <option key={e.slug} value={e.slug}>
                /events/{e.slug} — {e.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold text-white/50">کمپین (utm_campaign)</label>
          <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className={inputCls}>
            <option value="">— بدون کمپین —</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.utmCampaign ? ` (${c.utmCampaign})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold text-white/50">منبع (utm_source)</label>
          <select value={source} onChange={(e) => setSource(e.target.value)} className={inputCls}>
            {["instagram", "telegram", "google", "whatsapp", "qr", "partner", "direct"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold text-white/50">نوع (utm_medium)</label>
          <select value={medium} onChange={(e) => setMedium(e.target.value)} className={inputCls}>
            {["post", "story", "reels", "cpc", "banner", "bio", "qr"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={copy}
            className="h-[34px] w-full rounded-full bg-[#d4af37] px-4 text-xs font-black text-[#0a0a0f] transition hover:brightness-110"
          >
            {copied ? "✓ کپی شد" : "کپی لینک"}
          </button>
        </div>
      </div>
      <div
        dir="ltr"
        className="mt-4 break-all rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-left font-mono text-[11px] leading-5 text-emerald-300/90"
      >
        {link}
      </div>
    </div>
  );
}
