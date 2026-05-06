"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-[8px] px-3 text-xs font-medium transition disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-black text-white hover:bg-neutral-800",
        variant === "secondary" &&
          "border bg-white text-neutral-950 hover:bg-neutral-100",
        variant === "ghost" && "rounded-full bg-transparent hover:bg-neutral-100",
        variant === "danger" && "bg-[#c22b10] text-white hover:bg-[#a92612]",
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-8 w-full rounded-[8px] border bg-white px-2 text-xs outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black/10",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-20 w-full rounded-[8px] border bg-white px-2 py-1.5 text-xs outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black/10",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-8 w-full rounded-[8px] border bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-black/10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-[10px] font-medium uppercase tracking-[0.08em]", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[10px] bg-white p-3 shadow-[oklab(0.145_-0.00000143796_0.00000340492_/_0.1)_0px_0px_0px_1px]",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "neutral" | "inverse" | "outline" | "danger" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[20px] px-1.5 py-0.5 text-[10px] font-medium",
        variant === "neutral" && "bg-neutral-100 text-neutral-950",
        variant === "inverse" && "bg-black text-white",
        variant === "outline" && "border bg-white text-neutral-950",
        variant === "danger" && "bg-[#c22b10]/10 text-[#c22b10]",
        variant === "success" && "bg-[#10c22b]/10 text-[#0b8d20]",
        className,
      )}
      {...props}
    />
  );
}

export function Modal({
  title,
  description,
  open,
  onClose,
  children,
  className,
}: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-2">
      <div
        className={cn(
          "max-h-[94vh] w-full max-w-3xl overflow-auto rounded-[10px] bg-white p-4 shadow-2xl",
          className,
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.025em]">{title}</h2>
            {description ? (
              <p className="mt-1 text-xs text-neutral-500">{description}</p>
            ) : null}
          </div>
          <Button variant="ghost" type="button" onClick={onClose}>
            Закрыть
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex min-h-36 flex-col items-center justify-center gap-2 text-center">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="max-w-md text-xs text-neutral-500">{description}</p>
      {action}
    </Card>
  );
}
