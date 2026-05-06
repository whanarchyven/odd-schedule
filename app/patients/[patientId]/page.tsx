"use client";

import { useParams } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";
import { PatientPageContent } from "@/widgets/patient-page/ui/PatientPageContent";

export default function PatientPage() {
  const params = useParams<{ patientId: string }>();
  return (
    <PatientPageContent patientId={params.patientId as Id<"patients">} />
  );
}
