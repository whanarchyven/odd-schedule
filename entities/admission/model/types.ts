import type { Id } from "@/convex/_generated/dataModel";

export type ReferenceDoc = {
  _id: string;
  name?: string;
  code?: string;
  fullName?: string;
  color?: string;
};

export type AdmissionRow = {
  _id: Id<"admissions">;
  date: string;
  patientId: Id<"patients">;
  departmentId: Id<"departments">;
  diagnosisId: Id<"diagnoses">;
  doctorId: Id<"doctors">;
  financing: "oms" | "private";
  visitType: "primary" | "repeat";
  isConfirmed: boolean;
  source: "osmp" | "appointment" | "private";
  comment?: string;
  patient?: {
    _id: Id<"patients">;
    fullName: string;
    birthDate: string;
    phone?: string;
  } | null;
  department?: ReferenceDoc | null;
  diagnosis?: ReferenceDoc | null;
  doctor?: ReferenceDoc | null;
};

export type EntityOption = {
  _id: string;
  name?: string;
  fullName?: string;
  code?: string;
  color?: string;
};

export type PatientOption = {
  _id: Id<"patients">;
  fullName: string;
  birthDate: string;
};
