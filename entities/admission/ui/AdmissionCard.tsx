"use client";

import type { AdmissionRow } from "@/entities/admission/model/types";
import { calculateAge } from "@/entities/schedule/lib/date";

export function AdmissionCard({
  admission,
  onClick,
}: {
  admission: AdmissionRow;
  onClick: () => void;
}) {
  const minor =
    admission.patient &&
    calculateAge(admission.patient.birthDate, admission.date) < 18;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden rounded-[3px] border border-neutral-400 bg-white text-left text-[9px] leading-[1.12] transition hover:bg-neutral-50"
      title={admission.comment ?? ""}
    >
      <div className="flex flex-col gap-1 px-1 py-0.5">
        <span
          className={
            minor
              ? "whitespace-normal break-words text-[11px] font-semibold text-[#ff0000]"
              : "whitespace-normal break-words text-[11px] font-semibold"
          }
        >
          {admission.patient?.fullName ?? "Пациент"}
        </span>
        <div className="flex items-center justify-between">
        <span className="pt-px text-center font-medium">
          {admission.diagnosis?.code ?? "МКБ"}
        </span>
        <span className="pt-px text-center">
          {admission.financing === "oms" ? "ОМС" : "Част."}
        </span>
        <span
          className="rounded-[3px] px-1 pt-px text-center text-[10px] font-medium text-white"
          style={{
            background: admission.doctor?.color ?? "#000000",
          }}
        >
          {admission.visitType === "repeat" ? "Повт" : "Перв"}
        </span>
        <span
          className={
            admission.isConfirmed
              ? "text-right text-lg font-bold leading-3 text-[#10c22b]"
              : "text-right text-lg font-bold leading-3 text-[#ff0000]"
          }
        >
          {admission.isConfirmed ? "+" : "−"}
        </span>
        </div>
      </div>
      {admission.comment ? (
        <div className="flex justify-end px-1 pb-0.5">
          <span className="rounded-[3px] bg-amber-200 px-1 text-[8px] font-bold text-amber-950">
            ?
          </span>
        </div>
      ) : null}
    </button>
  );
}
