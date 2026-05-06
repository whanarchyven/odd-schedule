"use client";

import { FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Diagnosis } from "@/entities/admin/model/types";
import { Badge, Button, Card, Field, Input } from "@/shared/ui";

export function DiagnosesAdminTab({
  diagnoses,
}: {
  diagnoses: Diagnosis[];
}) {
  const createDiagnosis = useMutation(api.diagnoses.create);

  async function onDiagnosis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await createDiagnosis({
      code: String(form.get("code")),
      name: String(form.get("name")),
    });
    event.currentTarget.reset();
  }

  return (
    <Card>
      <h3 className="mb-4 font-semibold">МКБ-10</h3>
      <form className="mb-4 grid gap-3" onSubmit={(event) => void onDiagnosis(event)}>
        <Field label="Код">
          <Input name="code" placeholder="K29.7" required />
        </Field>
        <Field label="Название">
          <Input name="name" required />
        </Field>
        <Button type="submit">Добавить заболевание</Button>
      </form>
      <div className="space-y-2">
        {diagnoses.map((diagnosis) => (
          <div key={diagnosis._id} className="flex items-center justify-between rounded-[10px] border p-2 text-sm">
            <span><b>{diagnosis.code}</b> {diagnosis.name}</span>
            <Badge>{diagnosis.isActive ? "активно" : "скрыто"}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
