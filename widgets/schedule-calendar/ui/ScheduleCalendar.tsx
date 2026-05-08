"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { Plus, Printer } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "@/convex/_generated/api";
import type {
  AdmissionRow,
  EntityOption,
  PatientOption,
} from "@/entities/admission/model/types";
import {
  admissionDiagnosisLabel,
  financingLabel,
  sourceLabel,
  visitTypeLabel,
} from "@/entities/admission/model/options";
import { AdmissionCard } from "@/entities/admission/ui/AdmissionCard";
import {
  dateKey,
  dayTitle,
  daysInYear,
  months,
  nextWeekDays,
  weekdayMeta,
  weekdays,
} from "@/entities/schedule/lib/date";
import { CreateAdmissionModal } from "@/features/admission/create/ui/CreateAdmissionModal";
import { EditAdmissionModal } from "@/features/admission/edit/ui/EditAdmissionModal";
import { AppShell, PageHeader } from "@/widgets/app-shell/ui/AppShell";
import { formatDateRu, formatWeekdayRu } from "@/shared/lib/date";
import { Badge, Select } from "@/shared/ui";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function hexToRgb(hex?: string) {
  const normalized = (hex ?? "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return [245, 245, 245] as [number, number, number];
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ] as [number, number, number];
}

async function registerCyrillicFont(doc: jsPDF) {
  const response = await fetch("/fonts/ArialUnicode.ttf");
  const fontBase64 = arrayBufferToBase64(await response.arrayBuffer());
  doc.addFileToVFS("ArialUnicode.ttf", fontBase64);
  doc.addFont("ArialUnicode.ttf", "ArialUnicode", "normal");
  doc.setFont("ArialUnicode", "normal");
}

export function ScheduleCalendar() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [patientQuery, setPatientQuery] = useState("");
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [editingAdmission, setEditingAdmission] = useState<AdmissionRow | null>(null);
  const monthRefs = useRef<Array<HTMLElement | null>>([]);
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const admissionsResult = useQuery(api.admissions.listRange, {
    startDate,
    endDate,
  }) as AdmissionRow[] | undefined;
  const admissions = useMemo(() => admissionsResult ?? [], [admissionsResult]);
  const departments = (useQuery(api.departments.list, {}) ?? []) as EntityOption[];
  const doctors = (useQuery(api.doctors.list, {}) ?? []) as EntityOption[];
  const diagnoses = (useQuery(api.diagnoses.list, {}) ?? []) as EntityOption[];
  const patients = (useQuery(api.patients.list, {
    query: patientQuery,
    limit: 15,
  }) ?? []) as PatientOption[];

  const grouped = useMemo(() => {
    const map = new Map<string, AdmissionRow[]>();
    for (const admission of admissions) {
      map.set(admission.date, [...(map.get(admission.date) ?? []), admission]);
    }
    return map;
  }, [admissions]);

  const days = useMemo(() => daysInYear(year), [year]);

  useEffect(() => {
    const currentMonthIndex = new Date().getMonth();
    const frame = window.requestAnimationFrame(() => {
      monthRefs.current[currentMonthIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  async function printWeek(day: string) {
    const week = nextWeekDays(day);
    const doc = new jsPDF({ orientation: "landscape" });
    await registerCyrillicFont(doc);
    let cursorY = 16;

    doc.setFontSize(12);
    doc.text("Госпитализации на следующую неделю", 14, 16);
    doc.setFontSize(9);
    doc.text(`${formatDateRu(week[0])} - ${formatDateRu(week[6])}`, 14, 22);
    cursorY = 32;

    for (const dayKey of week) {
      const dayRows = admissions.filter((admission) => admission.date === dayKey);
      if (cursorY > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        doc.setFont("ArialUnicode", "normal");
        cursorY = 16;
      }

      doc.setFontSize(10);
      doc.text(`${formatDateRu(dayKey)}, ${formatWeekdayRu(dayKey)}`, 14, cursorY);
      cursorY += 4;

      autoTable(doc, {
        startY: cursorY,
        head: [[
          "Пациент",
          "Телефон",
          "Врач",
          "Отделение",
          "Диагноз",
          "Финанс.",
          "Источник",
          "Приём",
          "Статус",
        ]],
        body:
          dayRows.length > 0
            ? dayRows.map((admission) => [
                admission.patient?.fullName ?? "Пациент",
                admission.patient?.phone ?? "",
                admission.doctor?.fullName ?? "",
                admission.department?.name ?? "",
                admissionDiagnosisLabel(admission),
                financingLabel(admission.financing),
                sourceLabel(admission.source),
                visitTypeLabel(admission.visitType),
                admission.isConfirmed ? "Подтвержден" : "Не подтвержден",
              ])
            : [["Нет записей", "", "", "", "", "", "", "", ""]],
        margin: { left: 14, right: 14 },
        styles: {
          font: "ArialUnicode",
          fontSize: 7,
          cellPadding: 1.5,
          overflow: "linebreak",
        },
        headStyles: {
          font: "ArialUnicode",
          fillColor: [20, 20, 20],
          textColor: [255, 255, 255],
          fontStyle: "normal",
        },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 22 },
          2: { cellWidth: 26 },
          3: { cellWidth: 24 },
          4: { cellWidth: 30 },
          5: { cellWidth: 18 },
          6: { cellWidth: 18 },
          7: { cellWidth: 18 },
          8: { cellWidth: 20 },
        },
        didParseCell: (data) => {
          if (data.section !== "body" || data.column.index !== 2) return;
          const admission = dayRows[data.row.index];
          if (!admission?.doctor?.color) return;
          data.cell.styles.fillColor = hexToRgb(admission.doctor.color);
          data.cell.styles.textColor = [255, 255, 255];
        },
      });

      cursorY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? cursorY) + 10;

      if (cursorY > doc.internal.pageSize.getHeight() - 20 && dayKey !== week.at(-1)) {
        doc.addPage();
        doc.setFont("ArialUnicode", "normal");
        cursorY = 16;
      }
    }

    doc.save(`hospitalizations-${formatDateRu(week[0])}-${formatDateRu(week[6])}.pdf`);
  }

  return (
    <AppShell>
      <PageHeader
        title="График госпитализаций"
        description="Годовой календарь госпитализаций с быстрым добавлением, отметкой подтверждения, типом приёма и печатью недельного плана."
        action={
          <div className="flex gap-2">
            <Select
              value={String(year)}
              onChange={(event) => setYear(Number(event.target.value))}
              className="w-28"
            >
              {Array.from({ length: 8 }, (_, index) => 2020 + index).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
            <Select
              defaultValue={String(new Date().getMonth())}
              onChange={(event) =>
                monthRefs.current[Number(event.target.value)]?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
              className="w-40"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      <div className="space-y-4">
        {months.map((month, monthIndex) => {
          const monthDays = days.filter((day) => day.getMonth() === monthIndex);
          return (
            <section
              key={month}
              ref={(node) => {
                monthRefs.current[monthIndex] = node;
              }}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <h3 className="text-base font-semibold tracking-[-0.025em]">{month}</h3>
                <Badge>{monthDays.length} дней</Badge>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekdays.map((weekday) => (
                  <div
                    key={weekday.label}
                    className="rounded-[6px] border px-1.5 py-1 text-[10px] font-semibold"
                    style={{
                      background: weekday.color,
                      borderColor: weekday.border,
                    }}
                  >
                    {weekday.label}
                  </div>
                ))}
                {Array.from({ length: (monthDays[0].getDay() || 7) - 1 }).map((_, index) => (
                  <div key={`empty-${index}`} />
                ))}
                {monthDays.map((day) => {
                  const key = dateKey(day);
                  const dayAdmissions = grouped.get(key) ?? [];
                  const isWeekEnd = (day.getDay() || 7) === 7;
                  const meta = weekdayMeta(day);
                  return (
                    <div
                      key={key}
                      className="min-h-28 rounded-[6px] border bg-white p-0.5"
                      style={{ borderColor: meta.border }}
                    >
                      <div
                        className="mb-0.5 flex items-center justify-between rounded-[5px] border px-1 py-0.5"
                        style={{
                          background: meta.color,
                          borderColor: meta.border,
                        }}
                      >
                        <span className="truncate text-[10px] font-semibold leading-4">
                          {dayTitle(day)}
                        </span>
                        <div className="flex gap-0.5">
                          <button
                            type="button"
                            className="rounded-[4px] bg-white/60 p-0.5 hover:bg-white"
                            onClick={() => setModalDate(key)}
                            title="Добавить госпитализацию"
                          >
                            <Plus size={11} />
                          </button>
                          {isWeekEnd ? (
                            <button
                              type="button"
                              className="rounded-[4px] bg-white/60 p-0.5 hover:bg-white"
                              onClick={() => void printWeek(key)}
                              title="Печать следующей недели"
                            >
                              <Printer size={11} />
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        {dayAdmissions.map((admission) => (
                          <AdmissionCard
                            key={admission._id}
                            admission={admission}
                            onClick={() => setEditingAdmission(admission)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <CreateAdmissionModal
        date={modalDate}
        onClose={() => setModalDate(null)}
        patients={patients}
        patientQuery={patientQuery}
        setPatientQuery={setPatientQuery}
        departments={departments}
        doctors={doctors}
        diagnoses={diagnoses}
      />
      <EditAdmissionModal
        admission={editingAdmission}
        onClose={() => setEditingAdmission(null)}
        departments={departments}
        doctors={doctors}
        diagnoses={diagnoses}
        patients={patients}
        patientQuery={patientQuery}
        setPatientQuery={setPatientQuery}
      />
    </AppShell>
  );
}
