import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireDoctorOrAdmin } from "./lib/auth";

function inc(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

function toEntries(map: Record<string, number>) {
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export const dashboard = query({
  args: { startDate: v.string(), endDate: v.string() },
  returns: v.any(),
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
        .take(200);
      rows.push(...dayRows);
    }

    const bySource: Record<string, number> = {};
    const byFinancing: Record<string, number> = {};
    const byVisitType: Record<string, number> = {};
    const byDiagnosis: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    const timeline: Record<string, number> = {};
    let confirmed = 0;

    for (const row of rows) {
      if (row.isConfirmed) confirmed += 1;
      inc(bySource, row.source ?? "unspecified");
      inc(byFinancing, row.financing);
      inc(byVisitType, row.visitType);
      inc(timeline, row.date);

      const [diagnosis, department] = await Promise.all([
        row.diagnosisId ? ctx.db.get(row.diagnosisId) : null,
        ctx.db.get(row.departmentId),
      ]);
      inc(
        byDiagnosis,
        diagnosis
          ? `${diagnosis.code} ${diagnosis.name}`
          : row.customDiagnosis ?? "Без диагноза",
      );
      inc(byDepartment, department?.name ?? "Без отделения");
    }

    return {
      total: rows.length,
      confirmed,
      unconfirmed: rows.length - confirmed,
      bySource: toEntries(bySource),
      byFinancing: toEntries(byFinancing),
      byVisitType: toEntries(byVisitType),
      byDiagnosis: toEntries(byDiagnosis).slice(0, 10),
      byDepartment: toEntries(byDepartment),
      timeline: Object.entries(timeline)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      recent: rows
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30),
    };
  },
});
