import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  staffProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("doctor")),
    status: v.union(v.literal("active"), v.literal("inactive")),
    email: v.string(),
    fullName: v.string(),
    doctorId: v.optional(v.id("doctors")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_role", ["role"])
    .index("by_email", ["email"])
    .index("by_doctorId", ["doctorId"]),

  departments: defineTable({
    name: v.string(),
    normalizedName: v.string(),
    color: v.string(),
    coverStorageId: v.optional(v.id("_storage")),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_normalizedName", ["normalizedName"])
    .index("by_isActive", ["isActive"]),

  doctors: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    fullName: v.string(),
    searchText: v.string(),
    specialization: v.string(),
    birthDate: v.string(),
    login: v.string(),
    color: v.string(),
    departmentId: v.id("departments"),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_login", ["login"])
    .index("by_departmentId", ["departmentId"])
    .index("by_isActive", ["isActive"])
    .searchIndex("search_doctors", { searchField: "searchText" }),

  diagnoses: defineTable({
    name: v.string(),
    code: v.string(),
    searchText: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_isActive", ["isActive"])
    .searchIndex("search_diagnoses", { searchField: "searchText" }),

  patients: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    fullName: v.string(),
    searchText: v.string(),
    birthDate: v.string(),
    phone: v.string(),
    omsNumber: v.optional(v.string()),
    medicalRecordNumber: v.optional(v.string()),
    snils: v.optional(v.string()),
    photoStorageId: v.optional(v.id("_storage")),
    createdBy: v.id("staffProfiles"),
    updatedBy: v.id("staffProfiles"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_omsNumber", ["omsNumber"])
    .index("by_snils", ["snils"])
    .index("by_medicalRecordNumber", ["medicalRecordNumber"])
    .index("by_createdAt", ["createdAt"])
    .searchIndex("search_patients", { searchField: "searchText" }),

  patientHistoryEntries: defineTable({
    patientId: v.id("patients"),
    occurredAt: v.number(),
    title: v.string(),
    comment: v.optional(v.string()),
    createdBy: v.id("staffProfiles"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_patientId", ["patientId"])
    .index("by_patientId_and_occurredAt", ["patientId", "occurredAt"]),

  patientDocuments: defineTable({
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
    createdBy: v.id("staffProfiles"),
    createdAt: v.number(),
  })
    .index("by_patientId", ["patientId"])
    .index("by_historyEntryId", ["historyEntryId"]),

  admissions: defineTable({
    date: v.string(),
    patientId: v.id("patients"),
    departmentId: v.id("departments"),
    diagnosisId: v.id("diagnoses"),
    doctorId: v.id("doctors"),
    // Deprecated: earlier builds stored a duplicate "attending doctor".
    // New code uses doctorId as the single hospitalization doctor.
    attendingDoctorId: v.optional(v.id("doctors")),
    financing: v.union(v.literal("oms"), v.literal("private")),
    visitType: v.union(v.literal("primary"), v.literal("repeat")),
    isConfirmed: v.boolean(),
    source: v.union(v.literal("osmp"), v.literal("appointment"), v.literal("private")),
    comment: v.optional(v.string()),
    createdBy: v.id("staffProfiles"),
    updatedBy: v.id("staffProfiles"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_patientId", ["patientId"])
    .index("by_departmentId", ["departmentId"])
    .index("by_doctorId", ["doctorId"])
    .index("by_diagnosisId", ["diagnosisId"])
    .index("by_source", ["source"])
    .index("by_financing", ["financing"])
    .index("by_date_and_departmentId", ["date", "departmentId"])
    .index("by_date_and_source", ["date", "source"]),

  admissionDocuments: defineTable({
    admissionId: v.id("admissions"),
    storageId: v.id("_storage"),
    name: v.string(),
    contentType: v.optional(v.string()),
    createdBy: v.id("staffProfiles"),
    createdAt: v.number(),
  }).index("by_admissionId", ["admissionId"]),

  auditLogs: defineTable({
    actorProfileId: v.id("staffProfiles"),
    actorUserId: v.id("users"),
    actorRole: v.union(v.literal("admin"), v.literal("doctor")),
    actorName: v.string(),
    action: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("delete"),
      v.literal("upload"),
    ),
    entityType: v.union(
      v.literal("patient"),
      v.literal("patientHistoryEntry"),
      v.literal("patientDocument"),
      v.literal("admission"),
      v.literal("doctor"),
      v.literal("department"),
      v.literal("diagnosis"),
    ),
    entityId: v.string(),
    patientId: v.optional(v.id("patients")),
    admissionId: v.optional(v.id("admissions")),
    message: v.string(),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_actorProfileId", ["actorProfileId"])
    .index("by_entityType", ["entityType"])
    .index("by_patientId", ["patientId"])
    .index("by_admissionId", ["admissionId"]),

  statsDaily: defineTable({
    date: v.string(),
    total: v.number(),
    confirmed: v.number(),
    unconfirmed: v.number(),
    oms: v.number(),
    private: v.number(),
    primary: v.number(),
    repeat: v.number(),
    bySource: v.object({
      osmp: v.number(),
      appointment: v.number(),
      private: v.number(),
    }),
    updatedAt: v.number(),
  }).index("by_date", ["date"]),
});
