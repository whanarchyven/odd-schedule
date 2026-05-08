"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { PatientRow } from "@/entities/patient/model/types";
import { PatientsTable } from "@/entities/patient/ui/PatientsTable";
import { CreatePatientModal } from "@/features/patient/create/ui/CreatePatientModal";
import { AppShell, PageHeader } from "@/widgets/app-shell/ui/AppShell";
import { Button, Card, Input } from "@/shared/ui";

const PAGE_SIZE = 50;

export function PatientsPageContent() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const patientsResult = useQuery(api.patients.listForPagination, {
    query,
    limit: 10000,
  }) as PatientRow[] | undefined;
  const patients = useMemo(() => patientsResult ?? [], [patientsResult]);
  const totalPages = Math.max(1, Math.ceil(patients.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagePatients = useMemo(
    () => patients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, patients],
  );
  const pageNumbers = useMemo(
    () => visiblePageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  );

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
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Поиск по ФИО, полису ОМС, СНИЛС, телефону"
          />
        </div>
      </Card>

      <PatientsTable
        patients={pagePatients}
        onSelect={(patientId) => router.push(`/patients/${patientId}`)}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
        <span>
          Показано {pagePatients.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
          {Math.min(currentPage * PAGE_SIZE, patients.length)} из {patients.length}
        </span>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="px-2"
          >
            <ChevronLeft size={14} />
          </Button>
          {pageNumbers.map((item, index) =>
            item === "ellipsis" ? (
              <span key={`${item}-${index}`} className="px-2 text-neutral-400">
                ...
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === currentPage ? "primary" : "secondary"}
                onClick={() => setPage(item)}
                className="min-w-8 px-2"
              >
                {item}
              </Button>
            ),
          )}
          <Button
            type="button"
            variant="secondary"
            disabled={currentPage === totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="px-2"
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>

      <CreatePatientModal open={open} onClose={() => setOpen(false)} />
    </AppShell>
  );
}

function visiblePageNumbers(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = Array.from(pages)
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((left, right) => left - right);
  const result: Array<number | "ellipsis"> = [];
  for (const item of sorted) {
    const previous = result.at(-1);
    if (typeof previous === "number" && item - previous > 1) {
      result.push("ellipsis");
    }
    result.push(item);
  }
  return result;
}
