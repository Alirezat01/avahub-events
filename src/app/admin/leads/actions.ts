"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/avahub/admin";
import { logActivity } from "@/lib/avahub/activity";
import { LeadStatus } from "@prisma/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];

export async function updateLeadAction(fd: FormData): Promise<void> {
  const session = await assertAdmin();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  const note = String(fd.get("adminNote") ?? "").trim();

  if (!UUID_RE.test(id)) return;
  if (!STATUSES.includes(status as LeadStatus)) return;

  await db.lead.update({
    where: { id },
    data: {
      status: status as LeadStatus,
      ...(fd.has("adminNote") ? { adminNote: note || null } : {}),
    },
  });

  await logActivity({
    adminProfileId: session.profileId,
    adminName: session.fullName ?? session.email,
    action: "LEAD_STATUS",
    entity: "lead",
    entityId: id,
    detail: `وضعیت → ${status}${note ? ` | یادداشت: ${note.slice(0, 80)}` : ""}`,
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}

export async function deleteLeadAction(fd: FormData): Promise<void> {
  const session = await assertAdmin();
  const id = String(fd.get("id") ?? "");
  if (!UUID_RE.test(id)) return;

  await db.lead.delete({ where: { id } }).catch(() => null);

  await logActivity({
    adminProfileId: session.profileId,
    adminName: session.fullName ?? session.email,
    action: "LEAD_DELETE",
    entity: "lead",
    entityId: id,
  });

  revalidatePath("/admin/leads");
}
