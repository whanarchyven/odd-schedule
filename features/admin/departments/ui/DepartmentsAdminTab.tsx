"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Department } from "@/entities/admin/model/types";
import { Badge, Button, Card, Field, Input, Modal } from "@/shared/ui";

export function DepartmentsAdminTab({
  departments,
}: {
  departments: Department[];
}) {
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold">Отделения</h3>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Добавить отделение
        </Button>
      </div>
      <div className="space-y-2">
        {departments.map((department) => (
          <button
            key={department._id}
            type="button"
            onClick={() => setEditingDepartment(department)}
            className="flex w-full items-center justify-between rounded-[10px] border p-2 text-left hover:bg-neutral-50"
          >
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: department.color }} />
              {department.name}
            </span>
            <Badge>{department.isActive ? "активно" : "скрыто"}</Badge>
          </button>
        ))}
      </div>
      <DepartmentModal
        open={createOpen}
        department={null}
        onClose={() => setCreateOpen(false)}
      />
      <DepartmentModal
        open={Boolean(editingDepartment)}
        department={editingDepartment}
        onClose={() => setEditingDepartment(null)}
      />
    </Card>
  );
}

function DepartmentModal({
  open,
  department,
  onClose,
}: {
  open: boolean;
  department: Department | null;
  onClose: () => void;
}) {
  const createDepartment = useMutation(api.departments.create);
  const updateDepartment = useMutation(api.departments.update);
  const generateCoverUploadUrl = useMutation(api.departments.generateCoverUploadUrl);
  const isEditing = Boolean(department);

  async function uploadCover(file: File) {
    const uploadUrl = await generateCoverUploadUrl({});
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
    return storageId;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("cover");
    const coverStorageId =
      file instanceof File && file.size > 0
        ? await uploadCover(file)
        : department?.coverStorageId;

    if (department) {
      await updateDepartment({
        departmentId: department._id,
        name: String(form.get("name")),
        color: String(form.get("color") || "#000000"),
        coverStorageId,
        isActive: form.get("isActive") === "on",
      });
    } else {
      await createDepartment({
        name: String(form.get("name")),
        color: String(form.get("color") || "#000000"),
        coverStorageId,
      });
    }
    onClose();
  }

  async function setDeleted(nextDeleted: boolean) {
    if (!department) return;
    await updateDepartment({
      departmentId: department._id,
      name: department.name,
      color: department.color,
      coverStorageId: department.coverStorageId,
      isActive: !nextDeleted,
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Отделение" : "Новое отделение"}
      description="Просмотр, редактирование и удаление отделения."
    >
      <form className="grid gap-3" onSubmit={(event) => void onSubmit(event)}>
        <Field label="Название">
          <Input name="name" defaultValue={department?.name ?? ""} required />
        </Field>
        <Field label="Цвет">
          <Input
            name="color"
            type="color"
            defaultValue={department?.color ?? "#000000"}
          />
        </Field>
        <Field label="Обложка">
          <Input name="cover" type="file" accept="image/*" />
        </Field>
        {department ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={department.isActive}
              className="h-4 w-4"
            />
            Активно
          </label>
        ) : null}
        <div className="flex flex-wrap justify-between gap-2 pt-2">
          {department ? (
            <Button
              type="button"
              variant={department.isActive ? "danger" : "secondary"}
              onClick={() => void setDeleted(department.isActive)}
            >
              {department.isActive ? "Удалить" : "Восстановить"}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Закрыть
            </Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
