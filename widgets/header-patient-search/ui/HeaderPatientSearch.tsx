"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { AdmissionRow } from "@/entities/admission/model/types";
import {
  admissionDiagnosisShortLabel,
  financingShortLabel,
} from "@/entities/admission/model/options";
import { formatDateRu } from "@/shared/lib/date";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

type SearchRow = {
  patient: { _id: string; fullName: string; birthDate?: string };
  admissions: AdmissionRow[];
};

export function HeaderPatientSearch() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [appliedQuery, setAppliedQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const results = useQuery(
    api.admissions.searchPatientsWithAdmissions,
    appliedQuery && appliedQuery.length >= 2
      ? { query: appliedQuery, patientLimit: 12, admissionsPerPatient: 12 }
      : "skip",
  ) as SearchRow[] | undefined;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function runSearch() {
    const q = inputValue.trim();
    if (q.length < 2) {
      return;
    }
    setAppliedQuery(q);
    setOpen(true);
  }

  return (
    <div ref={rootRef} className="relative z-30 flex items-center gap-1.5">
      <Input
        value={inputValue}
        placeholder="ФИО…"
        className="h-8 w-44 text-xs"
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            runSearch();
          }
        }}
      />
      <Button
        type="button"
        variant="secondary"
        className="h-8 shrink-0 px-2.5"
        disabled={inputValue.trim().length < 2}
        onClick={runSearch}
        title="Поиск пациента"
      >
        <Search size={14} />
        Поиск
      </Button>

      {open && appliedQuery && appliedQuery.length >= 2 ? (
        <div
          className={cn(
            "absolute right-0 top-[calc(100%+6px)] w-[min(420px,calc(100vw-48px))] max-h-[min(480px,70vh)] overflow-auto rounded-[10px] border bg-white py-2 shadow-xl",
          )}
        >
          {results === undefined ? (
            <p className="px-3 py-2 text-[11px] text-neutral-500">Загрузка…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-[11px] text-neutral-500">Ничего не найдено</p>
          ) : (
            <ul className="space-y-2 px-2">
              {results.map((row) => (
                <li
                  key={row.patient._id}
                  className="rounded-[8px] border border-neutral-200 bg-neutral-50/80 px-2 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-tight text-neutral-950">
                        {row.patient.fullName}
                      </p>
                      {row.patient.birthDate ? (
                        <p className="mt-0.5 text-[10px] text-neutral-500">
                          {formatDateRu(row.patient.birthDate)}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={`/patients/${row.patient._id}`}
                      className={cn(
                        "inline-flex h-7 shrink-0 items-center justify-center rounded-[8px] border bg-white px-2 text-[10px] font-medium text-neutral-950 hover:bg-neutral-100",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      В карточку
                    </Link>
                  </div>
                  {row.admissions.length > 0 ? (
                    <ul className="mt-2 space-y-1 border-t border-neutral-200/80 pt-2">
                      {row.admissions.map((adm) => (
                        <li
                          key={adm._id}
                          className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-neutral-700"
                        >
                          <span className="font-medium text-neutral-900 tabular-nums">
                            {formatDateRu(adm.date)}
                          </span>
                          <span
                            className="shrink-0 rounded-[3px] px-1 py-px text-[9px] font-medium text-white"
                            style={{
                              background: adm.doctor?.color ?? "#404040",
                            }}
                            title={
                              adm.doctor?.fullName
                                ? `Врач: ${adm.doctor.fullName}`
                                : "Врач не назначен"
                            }
                          >
                            {adm.visitType === "repeat" ? "Повт" : "Перв"}
                          </span>
                          <span className="text-neutral-600">
                            {admissionDiagnosisShortLabel(adm)}
                          </span>
                          <span className="text-neutral-500">
                            {financingShortLabel(adm.financing)}
                          </span>
                          {adm.department?.name ? (
                            <span className="text-neutral-500">{adm.department.name}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 border-t border-neutral-200/80 pt-2 text-[10px] text-neutral-500">
                      Госпитализаций нет
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
