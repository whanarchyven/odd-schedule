"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type {
  AuditLog,
  Department,
  Diagnosis,
  Doctor,
  Staff,
} from "@/entities/admin/model/types";
import { AuditLogsAdminTab } from "@/features/admin/audit-logs/ui/AuditLogsAdminTab";
import { DepartmentsAdminTab } from "@/features/admin/departments/ui/DepartmentsAdminTab";
import { DiagnosesAdminTab } from "@/features/admin/diagnoses/ui/DiagnosesAdminTab";
import { DoctorsAdminTab } from "@/features/admin/doctors/ui/DoctorsAdminTab";
import { StaffAdminTab } from "@/features/admin/staff/ui/StaffAdminTab";
import { AppShell, PageHeader } from "@/widgets/app-shell/ui/AppShell";
import { Button, Card } from "@/shared/ui";

type AdminTab = "departments" | "doctors" | "diagnoses" | "staff" | "logs";

const tabs: Array<[AdminTab, string]> = [
  ["departments", "Отделения"],
  ["doctors", "Врачи"],
  ["diagnoses", "МКБ-10"],
  ["staff", "Пользователи и роли"],
  ["logs", "Логи"],
];

export function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>("departments");
  const departments = (useQuery(api.departments.list, {
    includeInactive: true,
  }) ?? []) as Department[];
  const doctors = (useQuery(api.doctors.list, {
    includeInactive: true,
  }) ?? []) as Doctor[];
  const diagnoses = (useQuery(api.diagnoses.list, {
    includeInactive: true,
  }) ?? []) as Diagnosis[];
  const staff = (useQuery(api.staff.list, {}) ?? []) as Staff[];
  const logs = (useQuery(api.auditLogs.listRecent, {
    limit: 80,
  }) ?? []) as AuditLog[];

  return (
    <AppShell>
      <PageHeader
        title="Администрирование"
        description="Справочники отделений, врачей и МКБ-10. Врачи получают доступ после создания записи и входа с указанным login/email."
      />

      <Card className="mb-4 flex flex-wrap gap-2">
        {tabs.map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={tab === value ? "primary" : "secondary"}
            onClick={() => setTab(value)}
          >
            {label}
          </Button>
        ))}
      </Card>

      {tab === "departments" ? (
        <DepartmentsAdminTab departments={departments} />
      ) : null}
      {tab === "doctors" ? (
        <DoctorsAdminTab doctors={doctors} departments={departments} />
      ) : null}
      {tab === "diagnoses" ? (
        <DiagnosesAdminTab diagnoses={diagnoses} />
      ) : null}
      {tab === "staff" ? <StaffAdminTab staff={staff} /> : null}
      {tab === "logs" ? <AuditLogsAdminTab logs={logs} /> : null}
    </AppShell>
  );
}
