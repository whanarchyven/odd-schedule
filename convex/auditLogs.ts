import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireDoctorOrAdmin } from "./lib/auth";

export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
    patientId: v.optional(v.id("patients")),
    admissionId: v.optional(v.id("admissions")),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireDoctorOrAdmin(ctx);
    const limit = Math.min(args.limit ?? 50, 100);
    if (args.patientId) {
      return await ctx.db
        .query("auditLogs")
        .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
        .order("desc")
        .take(limit);
    }
    if (args.admissionId) {
      return await ctx.db
        .query("auditLogs")
        .withIndex("by_admissionId", (q) =>
          q.eq("admissionId", args.admissionId!),
        )
        .order("desc")
        .take(limit);
    }
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});
