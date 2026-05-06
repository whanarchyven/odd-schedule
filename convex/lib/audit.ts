import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export type AuditActor = {
  _id: Id<"staffProfiles">;
  userId: Id<"users">;
  role: "admin" | "doctor";
  fullName: string;
};

export async function writeAuditLog(
  ctx: MutationCtx,
  args: {
    actor: AuditActor;
    action: "create" | "update" | "delete" | "upload";
    entityType:
      | "patient"
      | "patientHistoryEntry"
      | "patientDocument"
      | "admission"
      | "doctor"
      | "department"
      | "diagnosis";
    entityId: string;
    patientId?: Id<"patients">;
    admissionId?: Id<"admissions">;
    message: string;
  },
) {
  await ctx.db.insert("auditLogs", {
    actorProfileId: args.actor._id,
    actorUserId: args.actor.userId,
    actorRole: args.actor.role,
    actorName: args.actor.fullName,
    action: args.action,
    entityType: args.entityType,
    entityId: args.entityId,
    patientId: args.patientId,
    admissionId: args.admissionId,
    message: args.message,
    createdAt: Date.now(),
  });
}
