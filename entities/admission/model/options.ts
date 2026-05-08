export const financingOptions = [
  { value: "oms", label: "ОМС" },
  { value: "vmpOms", label: "ВМП-ОМС" },
  { value: "vmp", label: "ВМП" },
  { value: "paid", label: "ПЛАТНО" },
  { value: "fund", label: "ФОНД" },
] as const;

export const sourceOptions = [
  { value: "planned", label: "Планово" },
  { value: "tmk", label: "ТМК" },
  { value: "office", label: "Канцелярия" },
  { value: "kdc", label: "КДЦ" },
] as const;

export type Financing = (typeof financingOptions)[number]["value"] | "private";
export type AdmissionSource =
  | (typeof sourceOptions)[number]["value"]
  | "osmp"
  | "appointment"
  | "private";

export function financingLabel(value: string) {
  if (value === "private") return "ПЛАТНО";
  return financingOptions.find((option) => option.value === value)?.label ?? value;
}

export function financingShortLabel(value: string) {
  const labels: Record<string, string> = {
    oms: "ОМС",
    vmpOms: "ВМП-ОМС",
    vmp: "ВМП",
    paid: "ПЛ",
    fund: "ФОНД",
    private: "ПЛ",
  };
  return labels[value] ?? value;
}

export function sourceLabel(value?: string) {
  if (!value) return "Источник не указан";
  const legacyLabels: Record<string, string> = {
    osmp: "Планово",
    appointment: "Планово",
    private: "КДЦ",
    unspecified: "Источник не указан",
  };
  return (
    legacyLabels[value] ??
    sourceOptions.find((option) => option.value === value)?.label ??
    value
  );
}

export function visitTypeLabel(value: string) {
  if (value === "repeat") return "Повторный";
  if (value === "primary") return "Первичный";
  return value;
}

export function admissionDiagnosisLabel(admission: {
  diagnosis?: { code?: string; name?: string } | null;
  customDiagnosis?: string;
}) {
  const mkb = `${admission.diagnosis?.code ?? ""} ${admission.diagnosis?.name ?? ""}`.trim();
  return mkb || admission.customDiagnosis || "Диагноз не указан";
}

export function admissionDiagnosisShortLabel(admission: {
  diagnosis?: { code?: string } | null;
  customDiagnosis?: string;
}) {
  return admission.diagnosis?.code || admission.customDiagnosis || "Диагноз";
}
