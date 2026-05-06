"use client";

import { FormEvent, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Department, Doctor } from "@/entities/admin/model/types";
import { Badge, Button, Card, Field, Input, Modal, Select } from "@/shared/ui";

export function DoctorsAdminTab({
  doctors,
  departments,
}: {
  doctors: Doctor[];
  departments: Department[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold">Врачи</h3>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Добавить врача
        </Button>
      </div>
      <div className="space-y-2">
        {doctors.map((doctor) => (
          <button
            key={doctor._id}
            type="button"
            onClick={() => setEditingDoctor(doctor)}
            className="w-full rounded-[10px] border p-2 text-left text-sm hover:bg-neutral-50"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <span className="h-3 w-3 rounded-full" style={{ background: doctor.color }} />
                {doctor.fullName}
              </span>
              <Badge>{doctor.isActive ? "активно" : "скрыто"}</Badge>
            </div>
            <p className="text-neutral-500">{doctor.specialization} · {doctor.login}</p>
          </button>
        ))}
      </div>
      <DoctorModal
        open={createOpen}
        doctor={null}
        departments={departments}
        onClose={() => setCreateOpen(false)}
      />
      <DoctorModal
        open={Boolean(editingDoctor)}
        doctor={editingDoctor}
        departments={departments}
        onClose={() => setEditingDoctor(null)}
      />
    </Card>
  );
}

function DoctorModal({
  open,
  doctor,
  departments,
  onClose,
}: {
  open: boolean;
  doctor: Doctor | null;
  departments: Department[];
  onClose: () => void;
}) {
  const createDoctor = useAction(api.doctorActions.createWithPassword);
  const updateDoctor = useMutation(api.doctors.update);
  const isEditing = Boolean(doctor);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      lastName: String(form.get("lastName")),
      firstName: String(form.get("firstName")),
      middleName: String(form.get("middleName") || "") || undefined,
      specialization: String(form.get("specialization")),
      birthDate: String(form.get("birthDate")),
      login: String(form.get("login")),
      color: String(form.get("color") || "#000000"),
      departmentId: String(form.get("departmentId")) as Id<"departments">,
    };

    if (doctor) {
      await updateDoctor({
        doctorId: doctor._id,
        ...payload,
        isActive: form.get("isActive") === "on",
      });
    } else {
      await createDoctor({
        ...payload,
        password: String(form.get("password")),
      });
    }
    onClose();
  }

  async function setDeleted(nextDeleted: boolean) {
    if (!doctor) return;
    await updateDoctor({
      doctorId: doctor._id,
      lastName: doctor.lastName,
      firstName: doctor.firstName,
      middleName: doctor.middleName,
      specialization: doctor.specialization,
      birthDate: doctor.birthDate,
      login: doctor.login,
      color: doctor.color,
      departmentId: doctor.departmentId,
      isActive: !nextDeleted,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Врач" : "Новый врач"}
      description={
        isEditing
          ? "Просмотр, редактирование и удаление врача."
          : "Создание врача и учётной записи для входа."
      }
      className="max-w-3xl"
    >
      <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
        <Field label="Фамилия">
          <Input name="lastName" defaultValue={doctor?.lastName ?? ""} required />
        </Field>
        <Field label="Имя">
          <Input name="firstName" defaultValue={doctor?.firstName ?? ""} required />
        </Field>
        <Field label="Отчество">
          <Input name="middleName" defaultValue={doctor?.middleName ?? ""} />
        </Field>
        <Field label="Дата рождения">
          <Input name="birthDate" type="date" defaultValue={doctor?.birthDate ?? ""} required />
        </Field>
        <Field label="Специализация">
          <Input name="specialization" defaultValue={doctor?.specialization ?? ""} required />
        </Field>
        <Field label="Login / email">
          <Input name="login" type="email" defaultValue={doctor?.login ?? ""} required />
        </Field>
        {!doctor ? (
          <Field label="Пароль">
            <Input name="password" type="password" minLength={8} required />
          </Field>
        ) : null}
        <Field label="Цвет">
          <Input name="color" type="color" defaultValue={doctor?.color ?? "#000000"} />
        </Field>
        <Field label="Отделение">
          <Select name="departmentId" defaultValue={doctor?.departmentId ?? ""} required>
            <option value="">Выберите</option>
            {departments.map((department) => (
              <option key={department._id} value={department._id}>{department.name}</option>
            ))}
          </Select>
        </Field>
        {doctor ? (
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={doctor.isActive}
              className="h-4 w-4"
            />
            Активен
          </label>
        ) : null}
        <div className="md:col-span-2 flex flex-wrap justify-between gap-2 pt-2">
          {doctor ? (
            <Button
              type="button"
              variant={doctor.isActive ? "danger" : "secondary"}
              onClick={() => void setDeleted(doctor.isActive)}
            >
              {doctor.isActive ? "Удалить" : "Восстановить"}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
           
            <Button type="submit">Сохранить</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
