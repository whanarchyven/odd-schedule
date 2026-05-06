"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "convex/react";
import { Download, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type {
  EntityOption,
  PatientOption,
} from "@/entities/admission/model/types";
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
  patients,
  patientQuery,
  setPatientQuery,
  departments,
  doctors,
  diagnoses,
}: {
  date: string | null;
  onClose: () => void;
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date) return;
    const form = new FormData(event.currentTarget);
    let patientId = String(form.get("patientId")) as Id<"patients">;
    if (patientMode === "new") {
      patientId = await createPatient({
        lastName: String(form.get("lastName")),
        firstName: String(form.get("firstName")),
        middleName: String(form.get("middleName") || "") || undefined,
        birthDate: String(form.get("birthDate")),
        phone: String(form.get("phone")),
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

  return (
    <Modal
      open={Boolean(date)}
      onClose={onClose}
      title={`Госпитализация на ${date ?? ""}`}
      description="Шаг 1: пациент. Шаг 2: параметры госпитализации."
      className="max-w-5xl"
    >
      <form className="grid gap-5 lg:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
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
              <Field label="Поиск">
                <div className="flex items-center gap-2">
                  <Search size={16} />
                  <Input
                    value={patientQuery}
                    onChange={(event) => setPatientQuery(event.target.value)}
                    placeholder="ФИО, ОМС, СНИЛС"
                  />
                </div>
              </Field>
              <Field label="Пациент">
                <Select name="patientId" required>
                  <option value="">Выберите пациента</option>
                  {patients.map((patient) => (
                    <option key={patient._id} value={patient._id}>
                      {patient.fullName} · {formatDateRu(patient.birthDate)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Фамилия*"><Input name="lastName" required /></Field>
              <Field label="Имя*"><Input name="firstName" required /></Field>
              <Field label="Отчество"><Input name="middleName" /></Field>
              <Field label="Дата рождения*"><Input name="birthDate" type="date" required /></Field>
              <Field label="Телефон*"><Input name="phone" required /></Field>
              <Field label="ОМС"><Input name="omsNumber" /></Field>
              <Field label="Карта"><Input name="medicalRecordNumber" /></Field>
              <Field label="СНИЛС"><Input name="snils" /></Field>
            </div>
          )}
        </Card>

        <Card>
          <div className="grid gap-3 md:grid-cols-2">
            <EntitySelect label="Отделение" name="departmentId" items={departments} />
            <EntitySelect label="МКБ-10" name="diagnosisId" items={diagnoses} withCode />
            <EntitySelect label="Врач" name="doctorId" items={doctors} />
            <Field label="Финансирование">
              <Select name="financing" defaultValue="oms">
                <option value="oms">ОМС</option>
                <option value="private">Частное</option>
              </Select>
            </Field>
            <Field label="Приём">
              <Select name="visitType" defaultValue="primary">
                <option value="primary">Первичный</option>
                <option value="repeat">Повторный</option>
              </Select>
            </Field>
            <Field label="Источник">
              <Select name="source" defaultValue="appointment">
                <option value="osmp">ОСМП</option>
                <option value="appointment">Запись</option>
                <option value="private">Частная</option>
              </Select>
            </Field>
            <label className="flex items-center gap-2 pt-6 text-sm">
              <input name="isConfirmed" type="checkbox" className="h-4 w-4" />
              Подтверждена
            </label>
            <Field label="Комментарий" className="md:col-span-2">
              <Textarea name="comment" />
            </Field>
          </div>
        </Card>
        <div className="lg:col-span-2 flex justify-end gap-2">
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

function EntitySelect({
  label,
  name,
  items,
  withCode,
}: {
  label: string;
  name: string;
  items: EntityOption[];
  withCode?: boolean;
}) {
  return (
    <Field label={label}>
      <Select name={name} required>
        <option value="">Выберите</option>
        {items.map((item) => (
          <option key={item._id} value={item._id}>
            {withCode ? `${item.code ?? ""} ${item.name ?? ""}` : item.fullName ?? item.name}
          </option>
        ))}
      </Select>
    </Field>
  );
}
