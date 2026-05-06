import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireDoctorOrAdmin } from "./lib/auth";
import { searchText } from "./lib/format";
import { writeAuditLog } from "./lib/audit";

export const list = query({
  args: { includeInactive: v.optional(v.boolean()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireDoctorOrAdmin(ctx);
    if (args.includeInactive) {
      return await ctx.db.query("diagnoses").take(500);
    }
    return await ctx.db
      .query("diagnoses")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(500);
  },
});

export const search = query({
  args: { query: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireDoctorOrAdmin(ctx);
    const value = args.query.trim();
    if (value.length < 2) return [];
    return await ctx.db
      .query("diagnoses")
      .withSearchIndex("search_diagnoses", (q) => q.search("searchText", value))
      .take(30);
  },
});

export const create = mutation({
  args: {
    code: v.string(),
    name: v.string(),
  },
  returns: v.id("diagnoses"),
  handler: async (ctx, args) => {
    const profile = await requireAdmin(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("diagnoses", {
      code: args.code.trim().toUpperCase(),
      name: args.name.trim(),
      searchText: searchText(args.code, args.name),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await writeAuditLog(ctx, {
      actor: profile,
      action: "create",
      entityType: "diagnosis",
      entityId: id,
      message: `Создал диагноз МКБ-10: ${args.code}`,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    diagnosisId: v.id("diagnoses"),
    code: v.string(),
    name: v.string(),
    isActive: v.boolean(),
  },
  returns: v.id("diagnoses"),
  handler: async (ctx, args) => {
    const profile = await requireAdmin(ctx);
    await ctx.db.patch(args.diagnosisId, {
      code: args.code.trim().toUpperCase(),
      name: args.name.trim(),
      searchText: searchText(args.code, args.name),
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
    await writeAuditLog(ctx, {
      actor: profile,
      action: args.isActive ? "update" : "delete",
      entityType: "diagnosis",
      entityId: args.diagnosisId,
      message: args.isActive
        ? `Изменил диагноз МКБ-10: ${args.code}`
        : `Удалил диагноз МКБ-10: ${args.code}`,
    });
    return args.diagnosisId;
  },
});
