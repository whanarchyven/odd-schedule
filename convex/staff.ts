import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  isConfiguredAdmin,
  normalizeEmail,
  requireAdmin,
  requireAuthUser,
} from "./lib/auth";

export const ensureProfile = mutation({
  args: {},
  returns: v.id("staffProfiles"),
  handler: async (ctx) => {
    const { userId, user } = await requireAuthUser(ctx);
    const email = normalizeEmail(user.email);
    const now = Date.now();

    const existing = await ctx.db
      .query("staffProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        fullName: user.name ?? existing.fullName,
        updatedAt: now,
      });
      return existing._id;
    }

    const adminExists =
      (
        await ctx.db
          .query("staffProfiles")
          .withIndex("by_role", (q) => q.eq("role", "admin"))
          .take(1)
      ).length > 0;

    const invitedDoctor = await ctx.db
      .query("doctors")
      .withIndex("by_login", (q) => q.eq("login", email))
      .unique();

    const role = !adminExists || isConfiguredAdmin(email) ? "admin" : "doctor";
    if (role === "doctor" && !invitedDoctor) {
      throw new Error("Врач должен быть предварительно создан администратором");
    }

    return await ctx.db.insert("staffProfiles", {
      userId,
      role,
      status: "active",
      email,
      fullName:
        user.name ??
        invitedDoctor?.fullName ??
        (email.length > 0 ? email : "Администратор"),
      doctorId: invitedDoctor?._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const viewer = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("staffProfiles"),
      role: v.union(v.literal("admin"), v.literal("doctor")),
      status: v.union(v.literal("active"), v.literal("inactive")),
      email: v.string(),
      fullName: v.string(),
      doctorId: v.optional(v.id("doctors")),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const { userId } = await requireAuthUser(ctx);
    const profile = await ctx.db
      .query("staffProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return null;
    return {
      _id: profile._id,
      role: profile.role,
      status: profile.status,
      email: profile.email,
      fullName: profile.fullName,
      doctorId: profile.doctorId,
    };
  },
});

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("staffProfiles"),
      role: v.union(v.literal("admin"), v.literal("doctor")),
      status: v.union(v.literal("active"), v.literal("inactive")),
      email: v.string(),
      fullName: v.string(),
      doctorId: v.optional(v.id("doctors")),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const profiles = await ctx.db.query("staffProfiles").take(200);
    return profiles.map((profile) => ({
      _id: profile._id,
      role: profile.role,
      status: profile.status,
      email: profile.email,
      fullName: profile.fullName,
      doctorId: profile.doctorId,
      updatedAt: profile.updatedAt,
    }));
  },
});

export const setStatus = mutation({
  args: {
    profileId: v.id("staffProfiles"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  returns: v.id("staffProfiles"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.profileId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.profileId;
  },
});
