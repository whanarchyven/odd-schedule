import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { calculateAge, weekRangeAfter } from "./lib/format";
import { requireDoctorOrAdmin } from "./lib/auth";
import { writeAuditLog } from "./lib/audit";

const admissionInput = {
  date: v.string(),
  patientId: v.id("patients"),
  departmentId: v.id("departments"),
  diagnosisId: v.id("diagnoses"),
  doctorId: v.id("doctors"),
  financing: v.union(v.literal("oms"), v.literal("private")),
  visitType: v.union(v.literal("primary"), v.literal("repeat")),
  isConfirmed: v.boolean(),
  source: v.union(v.literal("osmp"), v.literal("appointment"), v.literal("private")),
  comment: v.optional(v.string()),
};

type AdmissionInput = {
  date: string;
  financing: "oms" | "private";
  visitType: "primary" | "repeat";
  isConfirmed: boolean;
  source: "osmp" | "appointment" | "private";
};

async function applyDailyDelta(
  ctx: MutationCtx,
  admission: AdmissionInput,
  delta: 1 | -1,
) {
  const existing = await ctx.db
    .query("statsDaily")
    .withIndex("by_date", (q) => q.eq("date", admission.date))
    .unique();
  const next = {
    total: (existing?.total ?? 0) + delta,
    confirmed: (existing?.confirmed ?? 0) + (admission.isConfirmed ? delta : 0),
    unconfirmed:
      (existing?.unconfirmed ?? 0) + (!admission.isConfirmed ? delta : 0),
    oms: (existing?.oms ?? 0) + (admission.financing === "oms" ? delta : 0),
    private:
      (existing?.private ?? 0) + (admission.financing === "private" ? delta : 0),
    primary:
      (existing?.primary ?? 0) + (admission.visitType === "primary" ? delta : 0),
    repeat:
      (existing?.repeat ?? 0) + (admission.visitType === "repeat" ? delta : 0),
    bySource: {
      osmp: (existing?.bySource.osmp ?? 0) + (admission.source === "osmp" ? delta : 0),
      appointment:
        (existing?.bySource.appointment ?? 0) +
        (admission.source === "appointment" ? delta : 0),
      private:
        (existing?.bySource.private ?? 0) +
        (admission.source === "private" ? delta : 0),
    },
    updatedAt: Date.now(),
  };
  if (existing) {
    await ctx.db.patch(existing._id, next);
  } else {
    await ctx.db.insert("statsDaily", { date: admission.date, ...next });
  }
}

async function enrichAdmission(
  ctx: QueryCtx,
  admission: Doc<"admissions">,
) {
  const [patient, department, diagnosis, doctor] =
    await Promise.all([
      ctx.db.get(admission.patientId),
      ctx.db.get(admission.departmentId),
      ctx.db.get(admission.diagnosisId),
      ctx.db.get(admission.doctorId),
    ]);
  return {
    ...admission,
    patient,
    department,
    diagnosis,
    doctor,
    patientAge: patient ? calculateAge(patient.birthDate, admission.date) : null,
  };
}

export const listRange = query({
  args: { startDate: v.string(), endDate: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireDoctorOrAdmin(ctx);
    const rows: Doc<"admissions">[] = [];
    const start = new Date(`${args.startDate}T00:00:00`);
    const end = new Date(`${args.endDate}T00:00:00`);
    for (
      const current = new Date(start);
      current <= end;
      current.setDate(current.getDate() + 1)
    ) {
      const key = current.toISOString().slice(0, 10);
      const dayRows = await ctx.db
        .query("admissions")
        .withIndex("by_date", (q) => q.eq("date", key))
        .take(100);
      rows.push(...dayRows);
    }
    return await Promise.all(rows.map((row) => enrichAdmission(ctx, row)));
  },
});

export const listByPatient = query({
  args: { patientId: v.id("patients") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireDoctorOrAdmin(ctx);
    const rows = await ctx.db
      .query("admissions")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .take(100);
    return await Promise.all(rows.map((row) => enrichAdmission(ctx, row)));
  },
});

export const weekPrintData = query({
  args: { date: v.string() },
  returns: v.object({ days: v.array(v.string()), admissions: v.array(v.any()) }),
  handler: async (ctx, args) => {
    await requireDoctorOrAdmin(ctx);
    const days = weekRangeAfter(args.date);
    const rows: Doc<"admissions">[] = [];
    for (const day of days) {
      const dayRows = await ctx.db
        .query("admissions")
        .withIndex("by_date", (q) => q.eq("date", day))
        .take(100);
      rows.push(...dayRows);
    }
    return {
      days,
      admissions: await Promise.all(rows.map((row) => enrichAdmission(ctx, row))),
    };
  },
});

export const create = mutation({
  args: admissionInput,
  returns: v.id("admissions"),
  handler: async (ctx, args) => {
    const profile = await requireDoctorOrAdmin(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("admissions", {
      ...args,
      createdBy: profile._id,
      updatedBy: profile._id,
      createdAt: now,
      updatedAt: now,
    });
    await applyDailyDelta(ctx, args, 1);
    await writeAuditLog(ctx, {
      actor: profile,
      action: "create",
      entityType: "admission",
      entityId: id,
      patientId: args.patientId,
      admissionId: id,
      message: "Создал запись на госпитализацию",
    });
    return id;
  },
});

export const update = mutation({
  args: { admissionId: v.id("admissions"), ...admissionInput },
  returns: v.id("admissions"),
  handler: async (ctx, args) => {
    const profile = await requireDoctorOrAdmin(ctx);
    const existing = await ctx.db.get(args.admissionId);
    if (!existing) throw new Error("Госпитализация не найдена");
    await applyDailyDelta(ctx, existing, -1);
    await ctx.db.patch(args.admissionId, {
      date: args.date,
      patientId: args.patientId,
      departmentId: args.departmentId,
      diagnosisId: args.diagnosisId,
      doctorId: args.doctorId,
      financing: args.financing,
      visitType: args.visitType,
      isConfirmed: args.isConfirmed,
      source: args.source,
      comment: args.comment,
      updatedBy: profile._id,
      updatedAt: Date.now(),
    });
    await applyDailyDelta(ctx, args, 1);
    await writeAuditLog(ctx, {
      actor: profile,
      action: "update",
      entityType: "admission",
      entityId: args.admissionId,
      patientId: args.patientId,
      admissionId: args.admissionId,
      message: "Изменил запись на госпитализацию",
    });
    return args.admissionId;
  },
});

export const remove = mutation({
  args: { admissionId: v.id("admissions") },
  returns: v.id("admissions"),
  handler: async (ctx, args) => {
    const profile = await requireDoctorOrAdmin(ctx);
    const existing = await ctx.db.get(args.admissionId);
    if (!existing) throw new Error("Госпитализация не найдена");
    await applyDailyDelta(ctx, existing, -1);
    const documents = await ctx.db
      .query("admissionDocuments")
      .withIndex("by_admissionId", (q) => q.eq("admissionId", args.admissionId))
      .take(100);
    for (const document of documents) {
      await ctx.db.delete(document._id);
    }
    await ctx.db.delete(args.admissionId);
    await writeAuditLog(ctx, {
      actor: profile,
      action: "delete",
      entityType: "admission",
      entityId: args.admissionId,
      patientId: existing.patientId,
      admissionId: args.admissionId,
      message: "Удалил запись на госпитализацию",
    });
    return args.admissionId;
  },
});

export const attachDocument = mutation({
  args: {
    admissionId: v.id("admissions"),
    storageId: v.id("_storage"),
    name: v.string(),
    contentType: v.optional(v.string()),
  },
  returns: v.id("admissionDocuments"),
  handler: async (ctx, args) => {
    const profile = await requireDoctorOrAdmin(ctx);
    const id = await ctx.db.insert("admissionDocuments", {
      ...args,
      createdBy: profile._id,
      createdAt: Date.now(),
    });
    const admission = await ctx.db.get(args.admissionId);
    await writeAuditLog(ctx, {
      actor: profile,
      action: "upload",
      entityType: "admission",
      entityId: args.admissionId,
      patientId: admission?.patientId,
      admissionId: args.admissionId,
      message: `Загрузил документ госпитализации: ${args.name}`,
    });
    return id;
  },
});
