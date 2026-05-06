"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import Link from "next/link";
import { ExternalLink, Search, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type {
  AdmissionRow,
  EntityOption,
  PatientOption,
} from "@/entities/admission/model/types";
import { formatDateRu } from "@/shared/lib/date";
import { Button, Field, Input, Modal, Select, Textarea } from "@/shared/ui";

export function EditAdmissionModal({
  admission,
  onClose,
  departments,
  doctors,
  diagnoses,
  patients,
  patientQuery,
  setPatientQuery,
}: {
  admission: AdmissionRow | null;
  onClose: () => void;
  departments: EntityOption[];
  doctors: EntityOption[];
  diagnoses: EntityOption[];
  patients: PatientOption[];
  patientQuery: string;
  setPatientQuery: (value: string) => void;
}) {
  const updateAdmission = useMutation(api.admissions.update);
  const removeAdmission = useMutation(api.admissions.remove);
  const [patientSelection, setPatientSelection] = useState<{
    admissionId: Id<"admissions">;
    patientId: Id<"patients">;
  } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedPatientId =
    admission && patientSelection?.admissionId === admission._id
      ? patientSelection.patientId
      : admission?.patientId ?? null;

  const selectedPatient = useMemo(() => {
    if (!admission || !selectedPatientId) return null;
    const found = patients.find((patient) => patient._id === selectedPatientId);
    if (found) return found;
    if (selectedPatientId === admission.patientId && admission.patient) {
      return admission.patient;
    }
    return null;
  }, [admission, patients, selectedPatientId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!admission || !selectedPatientId) return;
    const form = new FormData(event.currentTarget);
    await updateAdmission({
      admissionId: admission._id,
      date: String(form.get("date")),
      patientId: selectedPatientId,
      departmentId: String(form.get("departmentId")) as Id<"departments">,
      diagnosisId: String(form.get("diagnosisId")) as Id<"diagnoses">,
      doctorId: String(form.get("doctorId")) as Id<"doctors">,
      financing: String(form.get("financing")) as "oms" | "private",
      visitType: String(form.get("visitType")) as "primary" | "repeat",
      isConfirmed: form.get("isConfirmed") === "on",
      source: String(form.get("source")) as "osmp" | "appointment" | "private",
      comment: String(form.get("comment") || "") || undefined,
    });
    onClose();
  }

  async function onDelete() {
    if (!admission) return;
    await removeAdmission({ admissionId: admission._id });
    onClose();
  }

  return (
    <Modal
      open={Boolean(admission)}
      onClose={onClose}
      title="Госпитализация"
      description={admission?.patient?.fullName ?? "Просмотр и редактирование записи"}
      className="max-w-3xl"
    >
      {admission ? (
        <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
          <Field label="Дата">
            <Input name="date" type="date" defaultValue={admission.date} required />
          </Field>
          <Field label="Пациент">
            <div className="flex gap-2">
              <Input
                value={selectedPatient?.fullName ?? "Пациент не выбран"}
                disabled
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPickerOpen(true)}
              >
                Выбрать
              </Button>
            </div>
          </Field>
          <EntitySelect label="Отделение" name="departmentId" items={departments} defaultValue={admission.departmentId} />
          <EntitySelect label="МКБ-10" name="diagnosisId" items={diagnoses} defaultValue={admission.diagnosisId} withCode />
          <EntitySelect label="Врач" name="doctorId" items={doctors} defaultValue={admission.doctorId} />
          <Field label="Финансирование">
            <Select name="financing" defaultValue={admission.financing}>
              <option value="oms">ОМС</option>
              <option value="private">Частное</option>
            </Select>
          </Field>
          <Field label="Приём">
            <Select name="visitType" defaultValue={admission.visitType}>
              <option value="primary">Первичный</option>
              <option value="repeat">Повторный</option>
            </Select>
          </Field>
          <Field label="Источник">
            <Select name="source" defaultValue={admission.source}>
              <option value="osmp">ОСМП</option>
              <option value="appointment">Запись</option>
              <option value="private">Частная</option>
            </Select>
          </Field>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input
              name="isConfirmed"
              type="checkbox"
              className="h-4 w-4"
              defaultChecked={admission.isConfirmed}
            />
            Подтверждена
          </label>
          <Field label="Комментарий" className="md:col-span-2">
            <Textarea name="comment" defaultValue={admission.comment ?? ""} />
          </Field>
          <div className="md:col-span-2 flex flex-wrap justify-between gap-2">
            <div className="flex gap-2">
              <Button type="button" variant="danger" onClick={() => void onDelete()}>
                <Trash2 size={15} />
                Удалить
              </Button>
              <Link
                href={`/patients/${selectedPatientId ?? admission.patientId}`}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-[8px] border bg-white px-3 text-xs font-medium text-neutral-950 transition hover:bg-neutral-100"
              >
                <ExternalLink size={15} />
                Открыть пациента
              </Link>
            </div>
            <Button type="submit">Сохранить изменения</Button>
          </div>
        </form>
      ) : null}
      <PatientPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        patients={patients}
        query={patientQuery}
        setQuery={setPatientQuery}
        selectedPatientId={selectedPatientId}
        onSelect={(patientId) => {
          if (admission) {
            setPatientSelection({ admissionId: admission._id, patientId });
          }
          setPickerOpen(false);
        }}
      />
    </Modal>
  );
}

function PatientPickerModal({
  open,
  onClose,
  patients,
  query,
  setQuery,
  selectedPatientId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  patients: PatientOption[];
  query: string;
  setQuery: (value: string) => void;
  selectedPatientId: Id<"patients"> | null;
  onSelect: (patientId: Id<"patients">) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Выбор пациента"
      description="Найдите пациента по ФИО, ОМС или СНИЛС и выберите его для госпитализации."
      className="max-w-3xl"
    >
      <div className="space-y-3">
        <Field label="Поиск пациента">
          <div className="flex items-center gap-2">
            <Search size={16} />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ФИО, ОМС, СНИЛС"
            />
          </div>
        </Field>
        <div className="max-h-[55vh] space-y-2 overflow-auto">
          {patients.length === 0 ? (
            <p className="rounded-[10px] border p-3 text-sm text-neutral-500">
              Пациенты не найдены. Уточните поисковый запрос.
            </p>
          ) : (
            patients.map((patient) => (
              <button
                key={patient._id}
                type="button"
                onClick={() => onSelect(patient._id)}
                className={
                  patient._id === selectedPatientId
                    ? "flex w-full items-center justify-between rounded-[10px] border border-black bg-neutral-50 p-3 text-left text-sm"
                    : "flex w-full items-center justify-between rounded-[10px] border p-3 text-left text-sm hover:bg-neutral-50"
                }
              >
                <span>
                  <span className="block font-medium">{patient.fullName}</span>
                  <span className="text-xs text-neutral-500">
                    {formatDateRu(patient.birthDate)}
                  </span>
                </span>
                <span className="text-xs font-medium">
                  {patient._id === selectedPatientId ? "Выбран" : "Выбрать"}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

function EntitySelect({
  label,
  name,
  items,
  defaultValue,
  withCode,
}: {
  label: string;
  name: string;
  items: EntityOption[];
  defaultValue: string;
  withCode?: boolean;
}) {
  return (
    <Field label={label}>
      <Select name={name} defaultValue={defaultValue} required>
        {items.map((item) => (
          <option key={item._id} value={item._id}>
            {withCode ? `${item.code ?? ""} ${item.name ?? ""}` : item.fullName ?? item.name}
          </option>
        ))}
      </Select>
    </Field>
  );
}
