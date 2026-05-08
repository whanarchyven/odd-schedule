"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/convex/_generated/api";
import {
  financingLabel,
  sourceLabel,
  visitTypeLabel,
} from "@/entities/admission/model/options";
import type { Dashboard, StatEntry } from "@/entities/stat/model/types";
import { AppShell, PageHeader } from "@/widgets/app-shell/ui/AppShell";
import { formatDateRu } from "@/shared/lib/date";
import { Badge, Card, Field, Input } from "@/shared/ui";

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export function StatsDashboard() {
  const [initial] = useState(defaultRange);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const stats = useQuery(api.stats.dashboard, { startDate, endDate }) as
    | Dashboard
    | undefined;
  const bySource = mapEntries(stats?.bySource ?? [], sourceLabel);
  const byFinancing = mapEntries(stats?.byFinancing ?? [], financingLabel);
  const byVisitType = mapEntries(stats?.byVisitType ?? [], visitTypeLabel);

  return (
    <AppShell>
      <PageHeader
        title="Статистика"
        description="Оперативная аналитика госпитализаций по источникам, нозологиям, отделениям, финансированию и подтверждениям."
        action={
          <div className="grid grid-cols-2 gap-2">
            <Field label="Начало">
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </Field>
            <Field label="Конец">
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </Field>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Kpi title="Всего" value={stats?.total ?? 0} />
        <Kpi title="Подтверждены" value={stats?.confirmed ?? 0} tone="success" />
        <Kpi title="Не подтверждены" value={stats?.unconfirmed ?? 0} tone="danger" />
        <Kpi
          title="Доля подтверждений"
          value={
            stats && stats.total > 0
              ? `${Math.round((stats.confirmed / stats.total) * 100)}%`
              : "0%"
          }
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ChartCard title="Динамика по дням">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats?.timeline ?? []}>
              <CartesianGrid stroke="#e5e5e5" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatDateRu} />
              <YAxis allowDecimals={false} />
              <Tooltip labelFormatter={(label) => formatDateRu(String(label))} />
              <Line type="monotone" dataKey="value" stroke="#000000" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Источники">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={bySource}
                dataKey="value"
                nameKey="name"
                outerRadius={92}
                label
              >
                {bySource.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={["#000000", "#737373", "#e5e5e5"][index % 3]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Топ МКБ-10">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.byDiagnosis ?? []} layout="vertical">
              <CartesianGrid stroke="#e5e5e5" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#000000" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Отделения">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.byDepartment ?? []}>
              <CartesianGrid stroke="#e5e5e5" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#0a0a0a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ListCard title="Финансирование" items={byFinancing} />
        <ListCard title="Первичный / повторный" items={byVisitType} />
        <ListCard title="Списки по источникам" items={bySource} />
      </div>
    </AppShell>
  );
}

function mapEntries(items: StatEntry[], label: (value: string) => string) {
  const totals = new Map<string, number>();
  for (const item of items) {
    const name = label(item.name);
    totals.set(name, (totals.get(name) ?? 0) + item.value);
  }
  return Array.from(totals, ([name, value]) => ({ name, value })).sort(
    (left, right) => right.value - left.value,
  );
}

function Kpi({
  title,
  value,
  tone,
}: {
  title: string;
  value: string | number;
  tone?: "success" | "danger";
}) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.1em] text-neutral-500">{title}</p>
      <div className="mt-3 flex items-end justify-between">
        <p className="text-4xl font-semibold tracking-[-0.05em]">{value}</p>
        {tone ? <Badge variant={tone}>{tone === "success" ? "OK" : "Риск"}</Badge> : null}
      </div>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h3 className="mb-4 font-semibold">{title}</h3>
      {children}
    </Card>
  );
}

function ListCard({ title, items }: { title: string; items: StatEntry[] }) {
  return (
    <Card>
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-neutral-500">Нет данных за период.</p>
        ) : (
          items.map((item) => (
            <div key={item.name} className="flex items-center justify-between rounded-[10px] border p-2 text-sm">
              <span>{item.name}</span>
              <Badge variant="inverse">{item.value}</Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
