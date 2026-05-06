import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { normalizeText } from "./lib/format";
import { requireAdmin, requireDoctorOrAdmin } from "./lib/auth";
import { writeAuditLog } from "./lib/audit";

const departmentFields = {
  name: v.string(),
  color: v.string(),
  coverStorageId: v.optional(v.id("_storage")),
};

export const list = query({
  args: { includeInactive: v.optional(v.boolean()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireDoctorOrAdmin(ctx);
    if (args.includeInactive) {
      return await ctx.db.query("departments").take(300);
    }
    return await ctx.db
      .query("departments")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(300);
  },
});

export const create = mutation({
  args: departmentFields,
  returns: v.id("departments"),
  handler: async (ctx, args) => {
    const profile = await requireAdmin(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("departments", {
      ...args,
      normalizedName: normalizeText(args.name),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await writeAuditLog(ctx, {
      actor: profile,
      action: "create",
      entityType: "department",
      entityId: id,
      message: `Создал отделение: ${args.name}`,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    departmentId: v.id("departments"),
    ...departmentFields,
    isActive: v.boolean(),
  },
  returns: v.id("departments"),
  handler: async (ctx, args) => {
    const profile = await requireAdmin(ctx);
    await ctx.db.patch(args.departmentId, {
      name: args.name,
      normalizedName: normalizeText(args.name),
      color: args.color,
      coverStorageId: args.coverStorageId,
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
    await writeAuditLog(ctx, {
      actor: profile,
      action: args.isActive ? "update" : "delete",
      entityType: "department",
      entityId: args.departmentId,
      message: args.isActive
        ? `Изменил отделение: ${args.name}`
        : `Удалил отделение: ${args.name}`,
    });
    return args.departmentId;
  },
});

export const generateCoverUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
