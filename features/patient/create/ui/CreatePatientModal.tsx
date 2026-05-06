"use client";

import { FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, Field, Input, Modal } from "@/shared/ui";

export function CreatePatientModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createPatient = useMutation(api.patients.create);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await createPatient({
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
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Добавить пациента"
      description="Заполните обязательные поля, остальные можно уточнить позже."
    >
      <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
        <Field label="Фамилия*">
          <Input name="lastName" required />
        </Field>
        <Field label="Имя*">
          <Input name="firstName" required />
        </Field>
        <Field label="Отчество">
          <Input name="middleName" />
        </Field>
        <Field label="Дата рождения*">
          <Input name="birthDate" type="date" required />
        </Field>
        <Field label="Телефон*">
          <Input name="phone" required />
        </Field>
        <Field label="Полис ОМС">
          <Input name="omsNumber" />
        </Field>
        <Field label="Амбулаторная карта">
          <Input name="medicalRecordNumber" />
        </Field>
        <Field label="СНИЛС">
          <Input name="snils" />
        </Field>
        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">Сохранить</Button>
        </div>
      </form>
    </Modal>
  );
}
