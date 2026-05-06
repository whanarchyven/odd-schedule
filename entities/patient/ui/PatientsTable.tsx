"use client";

import { Pencil } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import type { PatientRow } from "@/entities/patient/model/types";
import { formatDateRu } from "@/shared/lib/date";
import { Card, EmptyState } from "@/shared/ui";

export function PatientsTable({
  patients,
  onSelect,
}: {
  patients: PatientRow[];
  onSelect: (patientId: Id<"patients">) => void;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <div className="grid min-w-[980px] grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_0.8fr_0.7fr] border-b bg-neutral-50 px-4 py-3 text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
          <span>ФИО</span>
          <span>Дата рождения</span>
          <span>Телефон</span>
          <span>ОМС</span>
          <span>СНИЛС</span>
          <span>Карта</span>
        </div>
        {patients.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="Пациенты не найдены"
              description="Измените поисковый запрос или добавьте пациента вручную."
            />
          </div>
        ) : (
          patients.map((patient) => (
            <button
              key={patient._id}
              type="button"
              onClick={() => onSelect(patient._id)}
              className="grid w-full min-w-[980px] grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_0.8fr_0.7fr] items-center border-b px-4 py-3 text-left text-sm transition last:border-b-0 hover:bg-neutral-50"
            >
              <span className="flex items-center gap-2 font-medium">
                {patient.fullName}
                <Pencil size={13} className="text-neutral-400" />
              </span>
              <span>{formatDateRu(patient.birthDate)}</span>
              <span>{patient.phone}</span>
              <span className="font-mono text-xs">{patient.omsNumber ?? "—"}</span>
              <span className="font-mono text-xs">{patient.snils ?? "—"}</span>
              <span className="font-mono text-xs">
                {patient.medicalRecordNumber ?? "—"}
              </span>
            </button>
          ))
        )}
      </div>
    </Card>
  );
}
