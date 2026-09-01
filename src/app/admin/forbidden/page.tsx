import Link from "next/link";

// صفحه دسترسی ممنوع — برای کاربران لاگین‌شده‌ای که ادمین نیستند
export default function ForbiddenPage() {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
      <h1 className="text-2xl font-bold text-rose-300">دسترسی غیرمجاز</h1>
      <p className="mt-3 text-white/70 leading-7">
        حساب شما اجازه ورود به پنل مدیریت را ندارد. اگر فکر می‌کنید اشتباهی رخ داده، با مدیر سیستم
        تماس بگیرید.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-xl bg-[#d4af37] px-6 py-2.5 font-bold text-[#0a0a0f] hover:brightness-110 transition"
      >
        بازگشت به سایت
      </Link>
    </div>
  );
}
