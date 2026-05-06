import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { fullName, searchText } from "./lib/format";
import { normalizeEmail, requireAdmin, requireDoctorOrAdmin } from "./lib/auth";
import { writeAuditLog } from "./lib/audit";

const doctorInput = {
  firstName: v.string(),
  lastName: v.string(),
  middleName: v.optional(v.string()),
  specialization: v.string(),
  birthDate: v.string(),
  login: v.string(),
  color: v.string(),
  departmentId: v.id("departments"),
};

type DoctorIdentity = {
  firstName: string;
  lastName: string;
  middleName?: string;
  specialization: string;
  login: string;
};

function composeDoctor(args: DoctorIdentity) {
  const name = fullName(args);
  return {
    fullName: name,
    searchText: searchText(name, args.specialization, args.login),
  };
}

export const list = query({
  args: {
    includeInactive: v.optional(v.boolean()),
    departmentId: v.optional(v.id("departments")),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireDoctorOrAdmin(ctx);
    if (args.departmentId) {
      return await ctx.db
        .query("doctors")
        .withIndex("by_departmentId", (q) =>
          q.eq("departmentId", args.departmentId!),
        )
        .take(300);
    }
    if (args.includeInactive) {
      return await ctx.db.query("doctors").take(300);
    }
    return await ctx.db
      .query("doctors")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(300);
  },
});

export const search = query({
  args: { query: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireDoctorOrAdmin(ctx);
    if (args.query.trim().length < 2) return [];
    return await ctx.db
      .query("doctors")
      .withSearchIndex("search_doctors", (q) =>
        q.search("searchText", args.query),
      )
      .take(20);
  },
});

export const create = mutation({
  args: doctorInput,
  returns: v.id("doctors"),
  handler: async (ctx, args) => {
    const profile = await requireAdmin(ctx);
    const now = Date.now();
    const computed = composeDoctor(args);
    const id = await ctx.db.insert("doctors", {
      ...args,
      login: normalizeEmail(args.login),
      ...computed,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await writeAuditLog(ctx, {
      actor: profile,
      action: "create",
      entityType: "doctor",
      entityId: id,
      message: `Создал врача: ${computed.fullName}`,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    doctorId: v.id("doctors"),
    ...doctorInput,
    isActive: v.boolean(),
  },
  returns: v.id("doctors"),
  handler: async (ctx, args) => {
    const profile = await requireAdmin(ctx);
    const computed = composeDoctor(args);
    await ctx.db.patch(args.doctorId, {
      firstName: args.firstName,
      lastName: args.lastName,
      middleName: args.middleName,
      specialization: args.specialization,
      birthDate: args.birthDate,
      login: normalizeEmail(args.login),
      color: args.color,
      departmentId: args.departmentId,
      isActive: args.isActive,
      ...computed,
      updatedAt: Date.now(),
    });
    await writeAuditLog(ctx, {
      actor: profile,
      action: args.isActive ? "update" : "delete",
      entityType: "doctor",
      entityId: args.doctorId,
      message: args.isActive
        ? `Изменил врача: ${computed.fullName}`
        : `Удалил врача: ${computed.fullName}`,
    });
    return args.doctorId;
  },
});
