"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Activity } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[14px] bg-black text-white">
            <Activity size={24} />
          </div>
          <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">
            НЦЗД
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
            График госпитализаций
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            Войдите как сотрудник
          </p>
        </div>
        <Card>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              setError(null);
              const formData = new FormData(e.target as HTMLFormElement);
              formData.set("flow", flow);
              void signIn("password", formData)
                .catch((authError: Error) => {
                  setError(authError.message);
                  setLoading(false);
                })
                .then(() => {
                  router.push("/schedule");
                });
            }}
          >
            <Input type="email" name="email" placeholder="Email" required />
            <div>
              <Input
                type="password"
                name="password"
                placeholder="Пароль"
                minLength={8}
                required
              />
              {flow === "signUp" && (
                <p className="mt-1 px-1 text-xs text-neutral-500">
                  Минимум 8 символов.
                </p>
              )}
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading
                ? "Подождите..."
                : flow === "signIn"
                  ? "Войти"
                  : "Первый вход / регистрация"}
            </Button>
          </form>
          <div className="mt-4 flex justify-center gap-2 text-sm">
            {/* <span className="text-neutral-500">
              {flow === "signIn" ? "Нет учётной записи?" : "Уже есть пароль?"}
            </span> */}
            {/* <button
              type="button"
              className="font-medium underline underline-offset-4"
              onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            >
              {flow === "signIn" ? "Зарегистрироваться" : "Войти"}
            </button> */}
          </div>
          {error && (
            <div className="mt-4 rounded-[10px] border border-[#c22b10]/30 bg-[#c22b10]/10 p-3">
              <p className="text-sm font-medium text-[#c22b10]">{error}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
