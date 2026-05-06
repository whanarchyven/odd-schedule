import { createAccount } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function fullName(parts: {
  lastName: string;
  firstName: string;
  middleName?: string;
}) {
  return [parts.lastName, parts.firstName, parts.middleName]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ");
}

export const createWithPassword = action({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    specialization: v.string(),
    birthDate: v.string(),
    login: v.string(),
    password: v.string(),
    color: v.string(),
    departmentId: v.id("departments"),
  },
  returns: v.id("doctors"),
  handler: async (ctx, args): Promise<Id<"doctors">> => {
    const viewer = await ctx.runQuery(api.staff.viewer, {});
    if (!viewer || viewer.role !== "admin" || viewer.status !== "active") {
      throw new Error("Требуются права администратора");
    }
    if (args.password.length < 8) {
      throw new Error("Пароль врача должен быть не короче 8 символов");
    }

    const login = normalizeEmail(args.login);
    await createAccount(ctx, {
      provider: "password",
      account: { id: login, secret: args.password },
      profile: {
        email: login,
        name: fullName(args),
      },
    });

    const doctorId: Id<"doctors"> = await ctx.runMutation(api.doctors.create, {
      firstName: args.firstName,
      lastName: args.lastName,
      middleName: args.middleName,
      specialization: args.specialization,
      birthDate: args.birthDate,
      login,
      color: args.color,
      departmentId: args.departmentId,
    });
    return doctorId;
  },
});
