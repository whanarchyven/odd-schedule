import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

function configuredAdminEmails() {
  return (process.env.INITIAL_ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeEmail(email: string | undefined) {
  return (email ?? "").trim().toLowerCase();
}

export function isConfiguredAdmin(email: string | undefined) {
  const normalized = normalizeEmail(email);
  return normalized !== "" && configuredAdminEmails().includes(normalized);
}

export async function requireAuthUser(ctx: Ctx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Необходимо войти в систему");
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Пользователь не найден");
  }
  return { userId, user };
}

export async function getCurrentProfile(ctx: Ctx) {
  const { userId } = await requireAuthUser(ctx);
  return await ctx.db
    .query("staffProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

export async function requireProfile(ctx: Ctx): Promise<Doc<"staffProfiles">> {
  const profile = await getCurrentProfile(ctx);
  if (!profile || profile.status !== "active") {
    throw new Error("Профиль персонала не активирован");
  }
  return profile;
}

export async function requireAdmin(ctx: Ctx): Promise<Doc<"staffProfiles">> {
  const profile = await requireProfile(ctx);
  if (profile.role !== "admin") {
    throw new Error("Требуются права администратора");
  }
  return profile;
}

export async function requireDoctorOrAdmin(
  ctx: Ctx,
): Promise<Doc<"staffProfiles">> {
  return await requireProfile(ctx);
}
