"use client";

import { useActionState, useRef, useState } from "react";
import {
  uploadMediaAction,
  replaceMediaAction,
  deleteMediaAction,
  type MediaActionState,
} from "@/app/admin/media/actions";
import type { MediaItem } from "@/lib/avahub/media";

// ─────────────────────────────────────────────────────────────
// Media Manager UI — فاز ۶
// آپلود (کشیدن و رها کردن)، تعویض عکس با همان آدرس،
// کپی آدرس، حذف — همه در یک گرافیکی مرتب
// ─────────────────────────────────────────────────────────────

const fmtSize = (b: number) =>
  b > 1024 * 1024
    ? `${(b / 1024 / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(b / 1024)).toLocaleString("fa-IR")} KB`;

function Notice({ state }: { state: MediaActionState }) {
  if (!state.error && !state.url) return null;
  return state.error ? (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
      {state.error}
    </div>
  ) : (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
      <span>انجام شد.</span>
      {state.url && (
        <button
          type="button"
          dir="ltr"
          onClick={() => navigator.clipboard?.writeText(state.url!)}
          className="max-w-[320px] truncate rounded-md border border-emerald-500/40 px-2 py-0.5 text-xs text-emerald-200"
          title="کپی آدرس"
        >
          {state.url}
        </button>
      )}
    </div>
  );
}

export function AdminMediaManager({ initialItems }: { initialItems: MediaItem[] }) {
  const [uploadState, uploadAction, uploadPending] = useActionState<MediaActionState, FormData>(
    uploadMediaAction,
    {}
  );
  const [replaceState, replaceAction, replacePending] = useActionState<MediaActionState, FormData>(
    replaceMediaAction,
    {}
  );
  const [deleteState, deleteAction, deletePending] = useActionState<MediaActionState, FormData>(
    deleteMediaAction,
    {}
  );

  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<MediaItem | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      window.prompt("آدرس را کپی کنید:", url);
    }
  };

  const startReplace = (item: MediaItem) => {
    setReplaceTarget(item);
    setTimeout(() => replaceInputRef.current?.click(), 50);
  };

  const onReplaceFile = () => {
    const input = replaceInputRef.current;
    if (!input || !input.files?.[0] || !replaceTarget) return;
    const fd = new FormData();
    fd.set("path", replaceTarget.name);
    fd.set("file", input.files[0]);
    // ارسال به اکشن تعویض
    void replaceAction(fd);
  };

  return (
    <div className="space-y-6">
      {/* آپلود */}
      <form
        action={uploadAction}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const input = e.currentTarget.querySelector<HTMLInputElement>('input[type="file"]');
          if (input && e.dataTransfer.files.length > 0) {
            const dt = new DataTransfer();
            dt.items.add(e.dataTransfer.files[0]);
            input.files = dt.files;
          }
        }}
        className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragOver ? "border-[#d4af37] bg-[#d4af37]/5" : "border-white/15 bg-[#12121a]"
        }`}
      >
        <input
          type="file"
          name="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="mx-auto block w-full max-w-md cursor-pointer rounded-xl border border-white/15 bg-white/[0.04] p-2.5 text-sm text-white/70 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#d4af37] file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#0a0a0f]"
          required
        />
        <p className="mt-3 text-xs text-white/45">
          عکس را اینجا بکشید و رها کنید یا انتخاب کنید — PNG، JPG، WebP، GIF، SVG تا ۱۵ مگابایت
        </p>
        <button
          type="submit"
          disabled={uploadPending}
          className="mt-4 rounded-xl bg-[#d4af37] px-6 py-2.5 text-sm font-bold text-[#0a0a0f] transition hover:brightness-110 disabled:opacity-50"
        >
          {uploadPending ? "در حال آپلود…" : "آپلود در رسانه‌ها"}
        </button>
        <div className="mt-4">{uploadState.error || uploadState.url ? <Notice state={uploadState} /> : null}</div>
      </form>

      {/* پیام‌های تعویض/حذف */}
      {(replaceState.error || deleteState.error) && (
        <Notice state={replaceState.error ? replaceState : deleteState} />
      )}
      {(replaceState.ok || deleteState.ok) && (
        <Notice state={replaceState.ok ? replaceState : deleteState} />
      )}

      {/* فایل مخفی تعویض */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={onReplaceFile}
      />
      {replacePending && (
        <div className="rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-3 text-sm text-[#d4af37]">
          در حال تعویض عکس… (همان آدرس قبلی حفظ می‌شود)
        </div>
      )}

      {/* گرید رسانه‌ها */}
      {initialItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#12121a] px-6 py-12 text-center text-white/50">
          رسانه‌ای نیست — اولین عکس را آپلود کنید. آدرس هر عکس را می‌توانید در فرم
          رویدادها، مجله و نمونه‌کارها استفاده کنید.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {initialItems.map((m) => (
            <div key={m.name} className="overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]">
              <div className="relative aspect-[4/3] bg-white/[0.03]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="p-3">
                <div className="truncate text-[11px] text-white/50" dir="ltr" title={m.name}>
                  {m.name}
                </div>
                <div className="mt-0.5 text-[10px] text-white/35">{fmtSize(m.size)}</div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => copyUrl(m.url)}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] transition ${
                      copied === m.url
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                        : "border-white/15 text-white/70 hover:bg-white/5"
                    }`}
                  >
                    {copied === m.url ? "کپی شد ✓" : "کپی آدرس"}
                  </button>
                  <button
                    type="button"
                    onClick={() => startReplace(m)}
                    className="flex-1 rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/10 px-2 py-1.5 text-[11px] font-bold text-[#d4af37] transition hover:bg-[#d4af37]/20"
                    title="آپلود عکس نو با همین آدرس — همه‌جای سایت عوض می‌شود"
                  >
                    تعویض
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingPath(m.name)}
                    className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-[11px] text-rose-300 transition hover:bg-rose-500/20"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* تأیید حذف */}
      {deletingPath && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setDeletingPath(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold">حذف این عکس؟</h3>
            <p className="mt-2 text-sm leading-6 text-white/60">
              اگر این عکس در سایت استفاده شده باشد، جای آن خالی می‌ماند. این عمل قابل بازگشت نیست.
            </p>
            <div className="mt-2 truncate rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white/40" dir="ltr">
              {deletingPath}
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingPath(null)}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
              >
                انصراف
              </button>
              <form action={() => {
                const fd = new FormData();
                fd.set("path", deletingPath);
                void deleteAction(fd);
                setDeletingPath(null);
              }}>
                <button
                  type="submit"
                  disabled={deletePending}
                  className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2 text-sm font-bold text-rose-300 transition hover:bg-rose-500/25 disabled:opacity-50"
                >
                  {deletePending ? "…" : "حذف قطعی"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
