import type { Id } from "@/convex/_generated/dataModel";
import type { AdmissionRow } from "@/entities/admission/model/types";

export type PatientRow = {
  _id: Id<"patients">;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  fullName: string;
  birthDate?: string;
  phone?: string;
  omsNumber?: string;
  snils?: string;
  medicalRecordNumber?: string;
  photoStorageId?: Id<"_storage">;
};

export type PatientDetails = {
  patient: PatientRow & { photoUrl?: string | null };
  history: Array<{
    _id: Id<"patientHistoryEntries">;
    occurredAt: number;
    title: string;
    comment?: string;
    documents: PatientDocument[];
  }>;
  documents: PatientDocument[];
} | null;

export type LoadedPatientDetails = NonNullable<PatientDetails>;

export type PatientAdmission = AdmissionRow;

export type PatientDocument = {
  _id: Id<"patientDocuments">;
  historyEntryId?: Id<"patientHistoryEntries">;
  name: string;
  contentType?: string;
  kind: "file" | "image" | "video" | "audio";
  url?: string | null;
};
