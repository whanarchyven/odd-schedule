import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { fullName, searchText } from "./lib/format";
import { requireDoctorOrAdmin } from "./lib/auth";
import { writeAuditLog } from "./lib/audit";

const patientInput = {
  firstName: v.string(),
  lastName: v.string(),
  middleName: v.optional(v.string()),
  birthDate: v.optional(v.string()),
  phone: v.optional(v.string()),
  omsNumber: v.optional(v.string()),
  medicalRecordNumber: v.optional(v.string()),
  snils: v.optional(v.string()),
  photoStorageId: v.optional(v.id("_storage")),
};

function composePatient(args: {
  firstName: string;
  lastName: string;
  middleName?: string;
  omsNumber?: string;
  medicalRecordNumber?: string;
  snils?: string;
  phone?: string;
}) {
  const name = fullName(args);
  return {
    fullName: name,
    searchText: searchText(
      name,
      args.omsNumber,
      args.medicalRecordNumber,
      args.snils,
      args.phone,
    ),
  };
}

export const list = query({
  args: { query: v.optional(v.string()), limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireDoctorOrAdmin(ctx);
    const limit = Math.min(args.limit ?? 50, 100);
    const value = args.query?.trim();
    if (value && value.length >= 2) {
      return await ctx.db
        .query("patients")
        .withSearchIndex("search_patients", (q) => q.search("searchText", value))
        .take(limit);
    }
    return await ctx.db.query("patients").order("desc").take(limit);
  },
});

export const listPage = query({
  args: {
    query: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await requireDoctorOrAdmin(ctx);
    const value = args.query?.trim();
    if (value && value.length >= 2) {
      return await ctx.db
        .query("patients")
        .withSearchIndex("search_patients", (q) => q.search("searchText", value))
        .paginate(args.paginationOpts);
    }
    return await ctx.db
      .query("patients")
      .withIndex("by_createdAt")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const listForPagination = query({
  args: { query: v.optional(v.string()), limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireDoctorOrAdmin(ctx);
    const limit = Math.min(args.limit ?? 10000, 10000);
    const value = args.query?.trim();
    if (value && value.length >= 2) {
      return await ctx.db
        .query("patients")
        .withSearchIndex("search_patients", (q) => q.search("searchText", value))
        .take(limit);
    }
    return await ctx.db
      .query("patients")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});

export const get = query({
  args: { patientId: v.id("patients") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    await requireDoctorOrAdmin(ctx);
    const patient = await ctx.db.get(args.patientId);
    if (!patient) return null;
    const photoUrl = patient.photoStorageId
      ? await ctx.storage.getUrl(patient.photoStorageId)
      : null;
    const history = await ctx.db
      .query("patientHistoryEntries")
      .withIndex("by_patientId_and_occurredAt", (q) =>
        q.eq("patientId", args.patientId),
      )
      .order("desc")
      .take(100);
    const documents = await ctx.db
      .query("patientDocuments")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .take(100);
    const documentsWithUrls = await Promise.all(
      documents.map(async (document) => ({
        ...document,
        url: await ctx.storage.getUrl(document.storageId),
      })),
    );
    const historyWithDocuments = history.map((entry) => ({
      ...entry,
      documents: documentsWithUrls.filter(
        (document) => document.historyEntryId === entry._id,
      ),
    }));
    return {
      patient: { ...patient, photoUrl },
      history: historyWithDocuments,
      documents: documentsWithUrls.filter((document) => !document.historyEntryId),
    };
  },
});

export const create = mutation({
  args: patientInput,
  returns: v.id("patients"),
  handler: async (ctx, args) => {
    const profile = await requireDoctorOrAdmin(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("patients", {
      ...args,
      ...composePatient(args),
      createdBy: profile._id,
      updatedBy: profile._id,
      createdAt: now,
      updatedAt: now,
    });
    await writeAuditLog(ctx, {
      actor: profile,
      action: "create",
      entityType: "patient",
      entityId: id,
      patientId: id,
      message: "Создал пациента",
    });
    return id;
  },
});

export const update = mutation({
  args: { patientId: v.id("patients"), ...patientInput },
  returns: v.id("patients"),
  handler: async (ctx, args) => {
    const profile = await requireDoctorOrAdmin(ctx);
    await ctx.db.patch(args.patientId, {
      firstName: args.firstName,
      lastName: args.lastName,
      middleName: args.middleName,
      birthDate: args.birthDate,
      phone: args.phone,
      omsNumber: args.omsNumber,
      medicalRecordNumber: args.medicalRecordNumber,
      snils: args.snils,
      photoStorageId: args.photoStorageId,
      ...composePatient(args),
      updatedBy: profile._id,
      updatedAt: Date.now(),
    });
    await writeAuditLog(ctx, {
      actor: profile,
      action: "update",
      entityType: "patient",
      entityId: args.patientId,
      patientId: args.patientId,
      message: "Изменил карточку пациента",
    });
    return args.patientId;
  },
});

export const addHistoryEntry = mutation({
  args: {
    patientId: v.id("patients"),
    occurredAt: v.number(),
    title: v.string(),
    comment: v.optional(v.string()),
  },
  returns: v.id("patientHistoryEntries"),
  handler: async (ctx, args) => {
    const profile = await requireDoctorOrAdmin(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("patientHistoryEntries", {
      ...args,
      createdBy: profile._id,
      createdAt: now,
      updatedAt: now,
    });
    await writeAuditLog(ctx, {
      actor: profile,
      action: "create",
      entityType: "patientHistoryEntry",
      entityId: id,
      patientId: args.patientId,
      message: `Добавил запись истории болезни: ${args.title}`,
    });
    return id;
  },
});

export const attachDocument = mutation({
  args: {
    patientId: v.id("patients"),
    historyEntryId: v.optional(v.id("patientHistoryEntries")),
    storageId: v.id("_storage"),
    name: v.string(),
    contentType: v.optional(v.string()),
    kind: v.union(
      v.literal("file"),
      v.literal("image"),
      v.literal("video"),
      v.literal("audio"),
    ),
  },
  returns: v.id("patientDocuments"),
  handler: async (ctx, args) => {
    const profile = await requireDoctorOrAdmin(ctx);
    const id = await ctx.db.insert("patientDocuments", {
      ...args,
      createdBy: profile._id,
      createdAt: Date.now(),
    });
    await writeAuditLog(ctx, {
      actor: profile,
      action: "upload",
      entityType: "patientDocument",
      entityId: id,
      patientId: args.patientId,
      message: `Загрузил документ пациента: ${args.name}`,
    });
    return id;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireDoctorOrAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
