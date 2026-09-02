-- ═══════════════════════════════════════════════════════════════
-- AVAHUB EVENTS — فاز ۶: پنل ادمین حرفه‌ای
-- جداول مجله + نمونه‌کارها + باکت رسانه (Supabase Storage)
--
-- ⭐ نحوه اجرا: Supabase Dashboard → SQL Editor → New query →
--    کل این فایل را Paste کنید → Run
--    (اگر قبلاً با prisma db push اعمال شده، این فایل idempotent است
--     و اجرای مجدد خطا نمی‌دهد)
-- ═══════════════════════════════════════════════════════════════

-- ─────────────── 1) enum وضعیت مقاله ───────────────
do $$ begin
  create type "PostStatus" as enum ('DRAFT', 'PUBLISHED');
exception when duplicate_object then null; end $$;

-- ─────────────── 2) جدول مجله آواهاب ───────────────
create table if not exists "journal_posts" (
  "id"              uuid primary key default gen_random_uuid(),
  "slug"            text not null unique,
  "title"           text not null,
  "excerpt"         text,
  "content"         text not null default '',
  "cover_image"     text,
  "icon"            text,
  "gradient"        text,
  "tags"            text[] not null default '{}',
  "status"          "PostStatus" not null default 'DRAFT',
  "published_at"    timestamptz,
  "author_name"     text,
  "meta_title"      text,
  "meta_description" text,
  "created_at"      timestamptz not null default now(),
  "updated_at"      timestamptz not null default now()
);
create index if not exists "journal_posts_status_published_at_idx"
  on "journal_posts"("status", "published_at");

-- ─────────────── 3) جدول نمونه‌کارها ───────────────
create table if not exists "portfolio_items" (
  "id"           uuid primary key default gen_random_uuid(),
  "title"        text not null,
  "tag"          text,
  "description"  text,
  "cover_image"  text not null,
  "link"         text,
  "sort_order"   integer not null default 0,
  "is_active"    boolean not null default true,
  "created_at"   timestamptz not null default now(),
  "updated_at"   timestamptz not null default now()
);
create index if not exists "portfolio_items_is_active_sort_order_idx"
  on "portfolio_items"("is_active", "sort_order");

-- ═══════════════════════════════════════════════════════════════
-- 4) باکت «media» در Supabase Storage — برای Media Manager
--    آپلود/تعویض عکس‌ها از پنل ادمین
--    دسترسی: خواندن عمومی، نوشتن فقط با کلید service_role
--    (کلید فقط سمت سرور در Server Action استفاده می‌شود)
-- ═══════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- خواندن عمومی فایل‌های باکت media (برای نمایش در سایت)
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read"
  on storage.objects for select
  using (bucket_id = 'media');
