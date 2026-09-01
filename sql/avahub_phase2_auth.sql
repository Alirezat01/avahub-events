-- ═══════════════════════════════════════════════════════════════════
-- AVAHUB EVENTS — فاز ۲: احراز هویت (Supabase Auth)
-- محل اجرا: Supabase Dashboard → SQL Editor → New query → Paste → Run
--
-- شامل:
-- ۱) تریگر خودکار: با هر ثبت‌نام (گوگل/ایمیل) یک ردیف در profiles ساخته می‌شود
-- ۲) پالیسی RLS: هر کاربر فقط پروفایل خودش را می‌بیند/ویرایش می‌کند
-- ۳) خواندن عمومی دسته‌بندی‌ها و رویدادهای منتشرشده (برای فازهای بعد)
-- ۴) اسکریپت ادمین‌کردن ایمیل خودتان
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- ۱) تریگر خودکار ساخت پروفایل پس از ثبت‌نام
--    داده‌های گوگل (نام و تصویر) به‌صورت خودکار ذخیره می‌شود
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = "public"
AS $$
BEGIN
  INSERT INTO "public"."profiles" ("authUserId", "email", "fullName", "firstSource")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    COALESCE(NEW.raw_user_meta_data ->> 'source', 'direct')
  )
  ON CONFLICT ("email") DO UPDATE
    SET "authUserId" = EXCLUDED."authUserId",
        "fullName"  = COALESCE("profiles"."fullName", EXCLUDED."fullName");
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";
CREATE TRIGGER "on_auth_user_created"
  AFTER INSERT ON "auth"."users"
  FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();

-- ─────────────────────────────────────────────
-- ۲) پالیسی‌های RLS پروفایل‌ها — هر کاربر فقط خودش
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "users_read_own_profile" ON "profiles";
CREATE POLICY "users_read_own_profile" ON "profiles"
  FOR SELECT TO authenticated
  USING (auth.uid() = "authUserId");

DROP POLICY IF EXISTS "users_update_own_profile" ON "profiles";
CREATE POLICY "users_update_own_profile" ON "profiles"
  FOR UPDATE TO authenticated
  USING (auth.uid() = "authUserId")
  WITH CHECK (auth.uid() = "authUserId");

-- ─────────────────────────────────────────────
-- ۳) خواندن عمومی دسته‌بندی‌ها + رویدادهای منتشرشده
--    (صفحات عمومی فاز ۳ و ۴ — ثبت‌نامی‌ها همچنان کاملاً قفل است)
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "public_read_categories" ON "categories";
CREATE POLICY "public_read_categories" ON "categories"
  FOR SELECT TO anon, authenticated
  USING ("isActive" = true);

DROP POLICY IF EXISTS "public_read_published_events" ON "events";
CREATE POLICY "public_read_published_events" ON "events"
  FOR SELECT TO anon, authenticated
  USING ("status" = 'PUBLISHED');

-- ثبت‌نامی‌ها / لیست انتظار / چک‌این‌ها: بدون پالیسی = کاملاً قفل 🔒
-- (فقط سرور از طریق Prisma دسترسی دارد)

-- ═══════════════════════════════════════════════════════════════════
-- ✅ ۴) ادمین‌کردن ایمیل خودتان — ایمیل را عوض کنید و فقط همین بخش را جدا اجرا کنید
-- ═══════════════════════════════════════════════════════════════════
-- INSERT INTO "admins" ("profileId", "role")
-- SELECT "id", 'SUPER_ADMIN' FROM "profiles"
-- WHERE "email" = 'YOUR-EMAIL@EXAMPLE.COM'
-- ON CONFLICT ("profileId") DO UPDATE SET "role" = 'SUPER_ADMIN', "isActive" = true;

-- ═══════════════════════════════════════════════════════════════════
-- ✅ بررسی نهایی — باید پالیسی‌های ساخته‌شده را لیست کند
-- ═══════════════════════════════════════════════════════════════════
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public' ORDER BY tablename, policyname;
