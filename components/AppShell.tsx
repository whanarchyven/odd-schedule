"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  LogOut,
  Users,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/patients", label: "Пациенты", icon: Users },
  { href: "/schedule", label: "График", icon: CalendarDays },
  { href: "/stats", label: "Статистика", icon: BarChart3 },
  { href: "/admin", label: "Админ", icon: Building2, adminOnly: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const ensureProfile = useMutation(api.staff.ensureProfile);
  const profile = useQuery(api.staff.viewer);

  useEffect(() => {
    if (isAuthenticated) {
      void ensureProfile({});
    }
  }, [ensureProfile, isAuthenticated]);

  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
          <Link href="/schedule" className="flex shrink-0 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-black text-white">
              <Activity size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold">График госпитализаций</p>
              <p className="text-[10px] text-neutral-500">НЦЗД</p>
            </div>
          </Link>

          <nav className="mx-2 flex min-w-0 flex-1 justify-center gap-1 rounded-[10px] border bg-neutral-50 p-0.5">
            {nav
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-xs transition",
                      active
                        ? "bg-black text-white"
                        : "text-neutral-700 hover:bg-white hover:text-black",
                    )}
                  >
                    <Icon size={14} />
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <div className="mr-1 text-right">
              <p className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                Стационар
              </p>
              <p className="text-xs font-semibold tracking-[-0.025em]">Сервис записи</p>
            </div>
            {profile ? (
              <Badge variant={isAdmin ? "inverse" : "neutral"}>
                {isAdmin ? "Админ" : "Врач"}
              </Badge>
            ) : null}
            <Button
              variant="secondary"
              type="button"
              onClick={() =>
                void signOut().then(() => {
                  router.push("/signin");
                })
              }
            >
              <LogOut size={16} />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="px-3 py-3">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-row flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.04em]">{title}</h2>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-500">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
