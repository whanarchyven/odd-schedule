import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { requireDoctorOrAdmin } from "./lib/auth";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

export const listNumbers = query({
  args: {
    count: v.number(),
  },
  returns: v.object({
    viewer: v.union(v.string(), v.null()),
    numbers: v.array(v.number()),
  }),
  handler: async (ctx, args) => {
    const profile = await requireDoctorOrAdmin(ctx);
    return {
      viewer: profile.email,
      numbers: Array.from({ length: Math.min(args.count, 10) }, (_, index) => index),
    };
  },
});

export const myAction = action({
  args: {
    first: v.number(),
    second: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log("Health action", args.first, args.second);
    return null;
  },
});
