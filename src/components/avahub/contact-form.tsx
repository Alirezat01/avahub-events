"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { SERVICES } from "@/lib/avahub/services";

const WHATSAPP_NUMBER = "989351077947";

/**
 * Contact form — composes a WhatsApp message (works today, no backend needed).
 * Will be connected to Supabase + Resend email in the next phases.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("مشاوره رایگان");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || phone.trim().length < 8 || message.trim().length < 5) {
      setError("لطفاً نام، شماره تماس و متن پیام را کامل وارد کنید.");
      return;
    }
    setError("");
    const text = [
      `سلام آواهاب 👋`,
      `نام: ${name.trim()}`,
      `شماره تماس: ${phone.trim()}`,
      `موضوع: ${topic}`,
      "",
      message.trim(),
    ].join("\n");
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const inputCls =
    "w-full rounded-xl border border-border bg-card/70 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20";

  return (
    <form onSubmit={submit} className="rounded-3xl border border-border bg-charcoal/60 p-6 sm:p-8" noValidate>
      <h2 className="mb-1.5 text-lg font-black">فرم درخواست مشاوره</h2>
      <p className="mb-6 text-xs leading-6 text-foreground/50">
        پیام شما مستقیم روی واتساپ تیم آواهاب باز می‌شود — سریع‌ترین راه رسیدن
        به ما.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="mb-1.5 block text-xs font-bold text-foreground/70">
            نام و نام خانوادگی *
          </label>
          <input
            id="cf-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً سارا محمدی"
            className={inputCls}
            required
          />
        </div>
        <div>
          <label htmlFor="cf-phone" className="mb-1.5 block text-xs font-bold text-foreground/70">
            شماره تماس *
          </label>
          <input
            id="cf-phone"
            type="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912 345 6789"
            className={`${inputCls} text-left`}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="cf-topic" className="mb-1.5 block text-xs font-bold text-foreground/70">
            موضوع
          </label>
          <select
            id="cf-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={inputCls}
          >
            <option>مشاوره رایگان</option>
            {SERVICES.map((service) => (
              <option key={service.slug}>{service.title}</option>
            ))}
            <option>سایر موارد</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="cf-msg" className="mb-1.5 block text-xs font-bold text-foreground/70">
            پیام شما *
          </label>
          <textarea
            id="cf-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="چیزی که در ذهن دارید را بنویسید..."
            rows={4}
            className={`${inputCls} resize-none leading-7`}
            required
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-black text-primary-foreground shadow-[0_0_30px_rgba(212,175,55,0.25)] transition-all hover:shadow-[0_0_50px_rgba(212,175,55,0.45)] sm:w-auto"
      >
        <Send className="size-4" aria-hidden="true" />
        ارسال پیام با واتساپ
      </button>
    </form>
  );
}
