"use client";

import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────
// دکمهٔ ارسال با تأیید مرورگری — برای اقدام‌های حساس (حذف/غیرفعال)
// ─────────────────────────────────────────────────────────────

export function ConfirmSubmit({
  message,
  className,
  title,
  children,
}: {
  message: string;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      title={title}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
