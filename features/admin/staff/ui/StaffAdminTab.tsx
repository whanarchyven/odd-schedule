"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Staff } from "@/entities/admin/model/types";
import { Badge, Button, Card } from "@/shared/ui";

export function StaffAdminTab({ staff }: { staff: Staff[] }) {
  const setStaffStatus = useMutation(api.staff.setStatus);

  return (
    <Card>
      <h3 className="mb-4 font-semibold">Пользователи и роли</h3>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {staff.map((profile) => (
          <div key={profile._id} className="rounded-[10px] border p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">{profile.fullName}</p>
                <p className="text-xs text-neutral-500">{profile.email}</p>
              </div>
              <Badge variant={profile.role === "admin" ? "inverse" : "neutral"}>
                {profile.role === "admin" ? "админ" : "врач"}
              </Badge>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-3 w-full"
              onClick={() =>
                void setStaffStatus({
                  profileId: profile._id,
                  status: profile.status === "active" ? "inactive" : "active",
                })
              }
            >
              {profile.status === "active" ? "Деактивировать" : "Активировать"}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
