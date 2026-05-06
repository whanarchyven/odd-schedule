"use client";

import type { AuditLog } from "@/entities/admin/model/types";
import { formatDateTimeRu } from "@/shared/lib/date";
import { Badge, Card, EmptyState } from "@/shared/ui";

const actionLabels: Record<AuditLog["action"], string> = {
  create: "создание",
  update: "изменение",
  delete: "удаление",
  upload: "загрузка",
};

export function AuditLogsAdminTab({ logs }: { logs: AuditLog[] }) {
  return (
    <Card>
      <h3 className="mb-4 font-semibold">Логи действий</h3>
      {logs.length === 0 ? (
        <EmptyState
          title="Логов пока нет"
          description="Здесь появятся действия врачей и администраторов."
        />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log._id} className="rounded-[10px] border p-3 text-sm">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{log.message}</p>
                <Badge variant={log.action === "delete" ? "danger" : "neutral"}>
                  {actionLabels[log.action]}
                </Badge>
              </div>
              <p className="text-xs text-neutral-500">
                {formatDateTimeRu(log.createdAt)} ·{" "}
                {log.actorName} · {log.actorRole === "admin" ? "админ" : "врач"} ·{" "}
                {log.entityType}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
