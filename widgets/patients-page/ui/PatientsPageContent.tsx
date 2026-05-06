"use client";

import { useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { PatientRow } from "@/entities/patient/model/types";
import { PatientsTable } from "@/entities/patient/ui/PatientsTable";
import { CreatePatientModal } from "@/features/patient/create/ui/CreatePatientModal";
import { AppShell, PageHeader } from "@/widgets/app-shell/ui/AppShell";
import { Button, Card, Input } from "@/shared/ui";

export function PatientsPageContent() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const {
    results: patients,
    status,
    loadMore,
  } = usePaginatedQuery(api.patients.listPage, {
    query,
  }, {
    initialNumItems: 25,
  }) as {
    results: PatientRow[];
    status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
    loadMore: (numItems: number) => void;
  };

  return (
    <AppShell>
      <PageHeader
        title="Пациенты"
        description="Единая библиотека пациентов: регистрация, поиск по ФИО, ОМС и СНИЛС, история болезни, документы и связанные госпитализации."
        action={
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus size={16} />
            Добавить пациента
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="flex items-center gap-3">
          <Search size={18} className="text-neutral-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по ФИО, полису ОМС, СНИЛС, телефону"
          />
        </div>
      </Card>

      <PatientsTable
        patients={patients}
        onSelect={(patientId) => router.push(`/patients/${patientId}`)}
      />

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-neutral-500">
        <span>Показано: {patients.length}</span>
        <Button
          type="button"
          variant="secondary"
          disabled={status !== "CanLoadMore"}
          onClick={() => loadMore(25)}
        >
          {status === "LoadingMore"
            ? "Загрузка..."
            : status === "Exhausted"
              ? "Все пациенты загружены"
              : "Показать ещё"}
        </Button>
      </div>

      <CreatePatientModal open={open} onClose={() => setOpen(false)} />
    </AppShell>
  );
}
