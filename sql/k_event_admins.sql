-- ─────────────────────────────────────────────────────────────
-- آواهاب ایونتس — فاز K: تخصیص رویداد به مدیر (دسترسی رویدادی)
-- این جدول توسط prisma db push ساخته شد؛ این فایل برای مستندسازی/اجرای دستی است
-- (قابل اجرای مکرر — IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────

create table if not exists "event_admins" (
    "id"        uuid not null default gen_random_uuid(),
    "adminId"   uuid not null,
    "eventId"   uuid not null,
    "createdAt" timestamp(3) not null default current_timestamp,

    constraint "event_admins_pkey" primary key ("id"),
    constraint "event_admins_adminId_fkey" foreign key ("adminId") references "admins"("id") on delete cascade on update cascade,
    constraint "event_admins_eventId_fkey" foreign key ("eventId") references "events"("id") on delete cascade on update cascade,
    constraint "event_admins_adminId_eventId_key" unique ("adminId", "eventId")
);

create index if not exists "event_admins_eventId_idx" on "event_admins"("eventId");
