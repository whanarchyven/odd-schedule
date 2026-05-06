"use client";

import { ChangeEvent, DragEvent, FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CalendarDays, FileText, Upload } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type {
  LoadedPatientDetails,
  PatientAdmission,
  PatientDetails,
  PatientDocument,
} from "@/entities/patient/model/types";
import { formatDateRu, formatDateTimeRu } from "@/shared/lib/date";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Textarea,
} from "@/shared/ui";

export function PatientModal({
  patientId,
  details,
  onClose,
}: {
  patientId: Id<"patients"> | null;
  details: PatientDetails | undefined;
  onClose: () => void;
}) {
  return (
    <Modal
      open={Boolean(patientId)}
      onClose={onClose}
      title={details?.patient.fullName ?? "Карточка пациента"}
      description="Информация, история болезни и госпитализации пациента в одной карточке."
      className="max-w-6xl"
    >
      <PatientCardContent patientId={patientId} details={details} />
    </Modal>
  );
}

export function PatientCardContent({
  patientId,
  details,
}: {
  patientId: Id<"patients"> | null;
  details: PatientDetails | undefined;
}) {
  const [tab, setTab] = useState<"info" | "history" | "admissions">("info");
  const admissions = useQuery(
    api.admissions.listByPatient,
    patientId ? { patientId } : "skip",
  ) as PatientAdmission[] | undefined;

  if (!details) {
    return <Card>Загрузка карточки пациента...</Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {[
          ["info", "Информация"],
          ["history", "История болезни"],
          ["admissions", "Госпитализации"],
        ].map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={tab === value ? "primary" : "secondary"}
            onClick={() => setTab(value as typeof tab)}
          >
            {label}
          </Button>
        ))}
      </div>
      {tab === "info" ? <PatientInfoTab details={details} /> : null}
      {tab === "history" ? <PatientHistoryTab details={details} /> : null}
      {tab === "admissions" ? (
        <PatientAdmissionsTab admissions={admissions ?? []} />
      ) : null}
    </div>
  );
}

function PatientInfoTab({ details }: { details: LoadedPatientDetails }) {
  const updatePatient = useMutation(api.patients.update);
  const generateUploadUrl = useMutation(api.patients.generateUploadUrl);
  const patient = details.patient;

  async function uploadPhoto(file: File) {
    const uploadUrl = await generateUploadUrl({});
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
    return storageId;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("photo");
    const nextPhotoStorageId =
      file instanceof File && file.size > 0
        ? await uploadPhoto(file)
        : details.patient.photoStorageId;
    await updatePatient({
      patientId: patient._id,
      lastName: String(form.get("lastName")),
      firstName: String(form.get("firstName")),
      middleName: String(form.get("middleName") || "") || undefined,
      birthDate: String(form.get("birthDate")),
      phone: String(form.get("phone")),
      omsNumber: String(form.get("omsNumber") || "") || undefined,
      medicalRecordNumber:
        String(form.get("medicalRecordNumber") || "") || undefined,
      snils: String(form.get("snils") || "") || undefined,
      photoStorageId: nextPhotoStorageId,
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Card className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-[14px] border bg-neutral-100">
          {patient.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={patient.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-5xl font-semibold">
              {patient.fullName.slice(0, 1)}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold">{patient.fullName}</p>
          <p className="text-sm text-neutral-500">{formatDateRu(patient.birthDate)}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {patient.omsNumber ? <Badge>ОМС {patient.omsNumber}</Badge> : null}
          {patient.snils ? <Badge>СНИЛС {patient.snils}</Badge> : null}
        </div>
      </Card>
      <Card>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
          <Field label="Фамилия*">
            <Input name="lastName" defaultValue={patient.lastName ?? ""} required />
          </Field>
          <Field label="Имя*">
            <Input name="firstName" defaultValue={patient.firstName ?? ""} required />
          </Field>
          <Field label="Отчество">
            <Input name="middleName" defaultValue={patient.middleName ?? ""} />
          </Field>
          <Field label="Дата рождения*">
            <Input name="birthDate" type="date" defaultValue={patient.birthDate} required />
          </Field>
          <Field label="Телефон*">
            <Input name="phone" defaultValue={patient.phone} required />
          </Field>
          <Field label="Полис ОМС">
            <Input name="omsNumber" defaultValue={patient.omsNumber ?? ""} />
          </Field>
          <Field label="Амбулаторная карта">
            <Input
              name="medicalRecordNumber"
              defaultValue={patient.medicalRecordNumber ?? ""}
            />
          </Field>
          <Field label="СНИЛС">
            <Input name="snils" defaultValue={patient.snils ?? ""} />
          </Field>
          <Field label="Фото" className="md:col-span-2">
            <Input name="photo" type="file" accept="image/*" />
          </Field>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Сохранить изменения</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function PatientHistoryTab({ details }: { details: LoadedPatientDetails }) {
  const addHistory = useMutation(api.patients.addHistoryEntry);
  const attachDocument = useMutation(api.patients.attachDocument);
  const generateUploadUrl = useMutation(api.patients.generateUploadUrl);
  const patient = details.patient;

  async function onHistorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await addHistory({
      patientId: patient._id,
      occurredAt: new Date(String(form.get("occurredAt"))).getTime(),
      title: String(form.get("title")),
      comment: String(form.get("comment") || "") || undefined,
    });
    event.currentTarget.reset();
  }

  async function uploadHistoryDocuments(
    files: File[],
    historyEntryId: Id<"patientHistoryEntries">,
  ) {
    for (const file of files) {
      const uploadUrl = await generateUploadUrl({});
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
      await attachDocument({
        patientId: patient._id,
        historyEntryId,
        storageId,
        name: file.name,
        contentType: file.type,
        kind: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : file.type.startsWith("audio/")
              ? "audio"
              : "file",
      });
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card>
        <h3 className="mb-3 font-semibold">Новая запись истории</h3>
        <form className="space-y-3" onSubmit={(event) => void onHistorySubmit(event)}>
          <Field label="Дата / время">
            <Input name="occurredAt" type="datetime-local" required />
          </Field>
          <Field label="Наименование">
            <Input name="title" required />
          </Field>
          <Field label="Комментарий">
            <Textarea name="comment" />
          </Field>
          <Button type="submit">Добавить запись</Button>
        </form>
      </Card>

      <Card className="lg:row-span-2">
        <h3 className="mb-3 font-semibold">История болезни</h3>
        <div className="space-y-3">
          {details.history.length === 0 ? (
            <p className="text-sm text-neutral-500">Записей пока нет.</p>
          ) : (
            details.history.map((entry) => (
              <div key={entry._id} className="rounded-[10px] border p-3">
                <p className="font-medium">{entry.title}</p>
                <p className="text-xs text-neutral-500">
                  {formatDateTimeRu(entry.occurredAt)}
                </p>
                {entry.comment ? (
                  <p className="mt-2 text-sm text-neutral-600">{entry.comment}</p>
                ) : null}
                <div className="mt-3 border-t pt-3">
                  <div className="mb-2">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
                      Документы записи
                    </p>
                  </div>
                  <HistoryDocumentDropzone
                    historyEntryId={entry._id}
                    onUpload={uploadHistoryDocuments}
                  />
                  <DocumentsGrid documents={entry.documents} />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

     
    </div>
  );
}

function HistoryDocumentDropzone({
  historyEntryId,
  onUpload,
}: {
  historyEntryId: Id<"patientHistoryEntries">;
  onUpload: (
    files: File[],
    historyEntryId: Id<"patientHistoryEntries">,
  ) => Promise<void>;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputId = `history-files-${historyEntryId}`;

  function addFiles(nextFiles: File[]) {
    setFiles((current) => {
      const result = [...current];
      for (const file of nextFiles) {
        const exists = result.some(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified,
        );
        if (!exists) result.push(file);
      }
      return result;
    });
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  async function uploadSelected() {
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      await onUpload(files, historyEntryId);
      setFiles([]);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mb-3 space-y-2">
      <label
        htmlFor={inputId}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={
          isDragging
            ? "flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-[10px] border border-black bg-neutral-100 p-3 text-center text-xs"
            : "flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed bg-neutral-50 p-3 text-center text-xs hover:bg-neutral-100"
        }
      >
        <Upload size={18} className="mb-1" />
        <span className="font-medium">Перетащите файлы сюда</span>
        <span className="text-neutral-500">
          или нажмите, чтобы выбрать сразу несколько файлов
        </span>
        <Input
          id={inputId}
          type="file"
          multiple
          className="hidden"
          onChange={onFileChange}
        />
      </label>

      {files.length > 0 ? (
        <div className="rounded-[10px] border p-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium">Выбрано файлов: {files.length}</p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFiles([])}
              disabled={isUploading}
            >
              Очистить
            </Button>
          </div>
          <div className="max-h-28 space-y-1 overflow-auto">
            {files.map((file) => (
              <div
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-neutral-500">
                  {formatFileSize(file.size)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void uploadSelected()}
          disabled={files.length === 0 || isUploading}
        >
          {isUploading ? "Загрузка..." : "Загрузить"}
        </Button>
      </div>
    </div>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} КБ`;
  return `${(size / 1024 / 1024).toFixed(1)} МБ`;
}

function DocumentsGrid({ documents }: { documents: PatientDocument[] }) {
  if (documents.length === 0) {
    return <p className="text-xs text-neutral-500">Документов пока нет.</p>;
  }

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {documents.map((document) => (
        <DocumentPreview key={document._id} document={document} />
      ))}
    </div>
  );
}

function DocumentPreview({ document }: { document: PatientDocument }) {
  const url = document.url ?? "#";
  const isImage = document.kind === "image" || document.contentType?.startsWith("image/");
  const isPdf =
    document.contentType === "application/pdf" ||
    document.name.toLowerCase().endsWith(".pdf");

  if (isImage) {
    return (
      <a
        href={url}
        target="_blank"
        className="group overflow-hidden rounded-[10px] border bg-neutral-50 hover:bg-neutral-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={document.name} className="h-32 w-full object-cover" />
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs">
          <FileText size={14} />
          <span className="truncate">{document.name}</span>
        </div>
      </a>
    );
  }

  if (isPdf) {
    return (
      <a
        href={url}
        target="_blank"
        className="flex items-center justify-between gap-2 rounded-[10px] border p-2 text-sm hover:bg-neutral-50"
      >
        <span className="flex min-w-0 items-center gap-2">
          <FileText size={16} />
          <span className="truncate">{document.name}</span>
        </span>
        <span className="shrink-0 text-xs font-medium">Открыть PDF</span>
      </a>
    );
  }

  return (
    <a
      href={url}
      download={document.name}
      className="flex items-center justify-between gap-2 rounded-[10px] border p-2 text-sm hover:bg-neutral-50"
    >
      <span className="flex min-w-0 items-center gap-2">
        <FileText size={16} />
        <span className="truncate">{document.name}</span>
      </span>
      <span className="shrink-0 text-xs font-medium">Скачать</span>
    </a>
  );
}

function PatientAdmissionsTab({ admissions }: { admissions: PatientAdmission[] }) {
  return (
    <Card>
      {admissions.length === 0 ? (
        <EmptyState
          title="Госпитализаций пока нет"
          description="После записи пациента на графике здесь появится история госпитализаций."
        />
      ) : (
        <div className="space-y-2">
          {admissions.map((admission) => (
            <div
              key={admission._id}
              className="grid gap-3 rounded-[10px] border p-3 text-sm md:grid-cols-[0.8fr_1fr_1fr_0.8fr]"
            >
              <div>
                <p className="font-semibold">{formatDateRu(admission.date)}</p>
                <p className="text-xs text-neutral-500">
                  {admission.isConfirmed ? "Подтверждена" : "Не подтверждена"}
                </p>
              </div>
              <div>
                <p>{admission.department?.name ?? "Отделение"}</p>
                <p className="text-xs text-neutral-500">
                  {admission.doctor?.fullName ?? "Врач"}
                </p>
              </div>
              <div>
                <p>
                  {admission.diagnosis?.code} {admission.diagnosis?.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {admission.financing === "oms" ? "ОМС" : "Частное"} ·{" "}
                  {admission.source}
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Badge variant={admission.visitType === "repeat" ? "neutral" : "inverse"}>
                  {admission.visitType === "repeat" ? "Повт" : "Перв"}
                </Badge>
                <CalendarDays size={16} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
