"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { Check, Download } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type {
  EntityOption,
  PatientOption,
} from "@/entities/admission/model/types";
import {
  type AdmissionSource,
  type Financing,
  financingOptions,
  sourceOptions,
} from "@/entities/admission/model/options";
import { formatDateRu } from "@/shared/lib/date";
import {
  Button,
  Card,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/shared/ui";

export function CreateAdmissionModal({
  date,
  onClose,
  scheduledPatientIdsForDate,
  patients,
  patientQuery,
  setPatientQuery,
  departments,
  doctors,
  diagnoses,
}: {
  date: string | null;
  onClose: () => void;
  scheduledPatientIdsForDate: Id<"patients">[];
  patients: PatientOption[];
  patientQuery: string;
  setPatientQuery: (value: string) => void;
  departments: EntityOption[];
  doctors: EntityOption[];
  diagnoses: EntityOption[];
}) {
  const createPatient = useMutation(api.patients.create);
  const createAdmission = useMutation(api.admissions.create);
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  const patientAlreadyOnThisDate = useMemo(() => {
    if (patientMode !== "existing" || !selectedPatientId || !date) {
      return false;
    }
    return scheduledPatientIdsForDate.includes(
      selectedPatientId as Id<"patients">,
    );
  }, [date, patientMode, scheduledPatientIdsForDate, selectedPatientId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date) return;
    const form = new FormData(event.currentTarget);
    let patientId = String(form.get("patientId")) as Id<"patients">;
    const diagnosisId = String(form.get("diagnosisId") || "");
    const customDiagnosis = String(form.get("customDiagnosis") || "").trim();
    const doctorId = String(form.get("doctorId") || "");
    if (
      (patientMode === "existing" && !patientId) ||
      !form.get("departmentId") ||
      (!diagnosisId && !customDiagnosis)
    ) {
      return;
    }

    if (patientMode === "new") {
      patientId = await createPatient({
        lastName: String(form.get("lastName")),
        firstName: String(form.get("firstName")),
        middleName: String(form.get("middleName") || "") || undefined,
        birthDate: String(form.get("birthDate") || "") || undefined,
        phone: String(form.get("phone") || "") || undefined,
        omsNumber: String(form.get("omsNumber") || "") || undefined,
        medicalRecordNumber:
          String(form.get("medicalRecordNumber") || "") || undefined,
        snils: String(form.get("snils") || "") || undefined,
      });
    }
    await createAdmission({
      date,
      patientId,
      departmentId: String(form.get("departmentId")) as Id<"departments">,
      diagnosisId: diagnosisId ? (diagnosisId as Id<"diagnoses">) : undefined,
      customDiagnosis: customDiagnosis || undefined,
      doctorId: doctorId ? (doctorId as Id<"doctors">) : undefined,
      financing: String(form.get("financing")) as Financing,
      visitType: String(form.get("visitType")) as "primary" | "repeat",
      isConfirmed: form.get("isConfirmed") === "on",
      source: String(form.get("source") || "") as AdmissionSource,
      comment: String(form.get("comment") || "") || undefined,
    });
    onClose();
  }

  return (
    <Modal
      open={Boolean(date)}
      onClose={onClose}
      title={`Госпитализация на ${formatDateRu(date ?? "")}`}
      description="Шаг 1: пациент. Шаг 2: параметры госпитализации."
      className="max-w-5xl"
    >
      <form
        className="grid grid-cols-2 gap-5"
        onSubmit={(event) => void onSubmit(event)}
      >
        <Card>
          <div className="mb-4 flex gap-2">
            <Button
              type="button"
              variant={patientMode === "existing" ? "primary" : "secondary"}
              onClick={() => setPatientMode("existing")}
            >
              Найти пациента
            </Button>
            <Button
              type="button"
              variant={patientMode === "new" ? "primary" : "secondary"}
              onClick={() => setPatientMode("new")}
            >
              Зарегистрировать
            </Button>
          </div>
          {patientMode === "existing" ? (
            <div className="space-y-3">
              <SearchableSelect
                label="Пациент"
                name="patientId"
                options={patients.map((patient) => ({
                  value: patient._id,
                  label: patient.fullName,
                  description: formatDateRu(patient.birthDate),
                }))}
                placeholder="ФИО, ОМС, СНИЛС"
                query={patientQuery}
                selectedValue={selectedPatientId}
                onQueryChange={setPatientQuery}
                onSelect={setSelectedPatientId}
                required
              />
              {patientAlreadyOnThisDate ? (
                <p
                  className="text-[11px] font-medium leading-snug text-[#c22b10]"
                  role="status"
                >
                  Пациент уже записан на эту дату.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Фамилия*"><Input name="lastName" required /></Field>
              <Field label="Имя*"><Input name="firstName" required /></Field>
              <Field label="Отчество"><Input name="middleName" /></Field>
              <Field label="Дата рождения"><Input name="birthDate" type="date" /></Field>
              <Field label="Телефон"><Input name="phone" /></Field>
              <Field label="ОМС"><Input name="omsNumber" /></Field>
              <Field label="Карта"><Input name="medicalRecordNumber" /></Field>
              <Field label="СНИЛС"><Input name="snils" /></Field>
            </div>
          )}
        </Card>

        <Card>
          <div className="grid grid-cols-2 gap-3">
            <EntitySearchableSelect
              label="Отделение"
              name="departmentId"
              items={departments}
              selectedValue={selectedDepartmentId}
              onSelect={setSelectedDepartmentId}
            />
            <EntitySearchableSelect
              label="МКБ-10"
              name="diagnosisId"
              items={diagnoses}
              selectedValue={selectedDiagnosisId}
              onSelect={setSelectedDiagnosisId}
              withCode
              required={false}
            />
            <Field label="Диагноз вручную">
              <Input name="customDiagnosis" placeholder="Если МКБ не выбран" />
            </Field>
            <EntitySearchableSelect
              label="Врач"
              name="doctorId"
              items={doctors}
              selectedValue={selectedDoctorId}
              onSelect={setSelectedDoctorId}
              required={false}
            />
            <Field label="Финансирование">
              <Select name="financing" defaultValue="oms">
                {financingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Приём">
              <Select name="visitType" defaultValue="primary">
                <option value="primary">Первичный</option>
                <option value="repeat">Повторный</option>
              </Select>
            </Field>
            <Field label="Источник">
              <Select name="source" defaultValue="planned">
                {sourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
            <label className="flex items-center gap-2 pt-6 text-sm">
              <input name="isConfirmed" type="checkbox" className="h-4 w-4" />
              Подтверждена
            </label>
            <Field label="Комментарий" className="col-span-2">
              <Textarea name="comment" />
            </Field>
          </div>
        </Card>
        <div className="col-span-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">
            <Download size={16} /> Создать
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EntitySearchableSelect({
  label,
  name,
  items,
  selectedValue,
  onSelect,
  withCode,
  required = true,
}: {
  label: string;
  name: string;
  items: EntityOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  withCode?: boolean;
  required?: boolean;
}) {
  const options = useMemo(
    () =>
      items.map((item) => ({
        value: item._id,
        label: withCode ? `${item.code ?? ""} ${item.name ?? ""}` : item.fullName ?? item.name ?? "",
      })),
    [items, withCode],
  );

  return (
    <SearchableSelect
      label={label}
      name={name}
      options={options}
      selectedValue={selectedValue}
      onSelect={onSelect}
      placeholder="Начните вводить"
      required={required}
    />
  );
}

function SearchableSelect({
  label,
  name,
  options,
  placeholder,
  selectedValue,
  onSelect,
  required,
  query,
  onQueryChange,
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string; description?: string }>;
  placeholder?: string;
  selectedValue: string;
  onSelect: (value: string) => void;
  required?: boolean;
  query?: string;
  onQueryChange?: (value: string) => void;
}) {
  const [internalQuery, setInternalQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputValue = query ?? internalQuery;
  const selectedOption = options.find((option) => option.value === selectedValue);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = inputValue.trim().toLowerCase();
    const result = normalizedQuery
      ? options.filter((option) =>
          `${option.label} ${option.description ?? ""}`
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : options;
    return result.slice(0, 30);
  }, [inputValue, options]);

  function setInputValue(value: string) {
    if (query === undefined) {
      setInternalQuery(value);
    }
    onQueryChange?.(value);
  }

  return (
    <Field label={label}>
      <div className="relative">
        <input name={name} value={selectedValue} readOnly className="sr-only" />
        <Input
          value={inputValue}
          placeholder={placeholder}
          required={required}
          onChange={(event) => {
            setInputValue(event.target.value);
            onSelect("");
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 120);
          }}
        />
        {selectedOption ? (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500">
            выбрано
          </span>
        ) : null}
        {isOpen ? (
          <div className="absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-[8px] border bg-white p-1 shadow-xl">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-[6px] px-2 py-1.5 text-left text-xs hover:bg-neutral-100"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelect(option.value);
                    setInputValue(option.label);
                    setIsOpen(false);
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{option.label}</span>
                    {option.description ? (
                      <span className="block truncate text-[10px] text-neutral-500">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  {option.value === selectedValue ? (
                    <Check size={14} className="shrink-0" />
                  ) : null}
                </button>
              ))
            ) : (
              <div className="px-2 py-2 text-xs text-neutral-500">Ничего не найдено</div>
            )}
          </div>
        ) : null}
      </div>
    </Field>
  );
}
