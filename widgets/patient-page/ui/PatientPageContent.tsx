"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { PatientDetails } from "@/entities/patient/model/types";
import { PatientCardContent } from "@/widgets/patient-card/ui/PatientModal";
import { AppShell, PageHeader } from "@/widgets/app-shell/ui/AppShell";
import { Button } from "@/shared/ui";

export function PatientPageContent({
  patientId,
}: {
  patientId: Id<"patients">;
}) {
  const details = useQuery(api.patients.get, { patientId }) as
    | PatientDetails
    | undefined;

  return (
    <AppShell>
      <PageHeader
        title={details?.patient.fullName ?? "Пациент"}
        description="Просмотр и редактирование карточки пациента, истории болезни, документов и госпитализаций."
        action={
          <Link href="/patients">
            <Button type="button" variant="secondary">
              <ArrowLeft size={16} />
              К списку пациентов
            </Button>
          </Link>
        }
      />
      <PatientCardContent patientId={patientId} details={details} />
    </AppShell>
  );
}
