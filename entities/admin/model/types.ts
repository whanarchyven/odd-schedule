import type { Id } from "@/convex/_generated/dataModel";

export type Department = {
  _id: Id<"departments">;
  name: string;
  color: string;
  coverStorageId?: Id<"_storage">;
  isActive: boolean;
};

export type Doctor = {
  _id: Id<"doctors">;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
  specialization: string;
  birthDate: string;
  login: string;
  color: string;
  departmentId: Id<"departments">;
  isActive: boolean;
};

export type Diagnosis = {
  _id: Id<"diagnoses">;
  code: string;
  name: string;
  isActive: boolean;
};

export type Staff = {
  _id: Id<"staffProfiles">;
  email: string;
  fullName: string;
  role: "admin" | "doctor";
  status: "active" | "inactive";
};

export type AuditLog = {
  _id: Id<"auditLogs">;
  actorName: string;
  actorRole: "admin" | "doctor";
  action: "create" | "update" | "delete" | "upload";
  entityType: string;
  message: string;
  createdAt: number;
};
