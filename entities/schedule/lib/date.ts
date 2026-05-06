import { formatDateRu } from "@/shared/lib/date";

export const months = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export const weekdays = [
  { label: "Пн", color: "#fef3c7", border: "#f59e0b" },
  { label: "Вт", color: "#dcfce7", border: "#22c55e" },
  { label: "Ср", color: "#dbeafe", border: "#3b82f6" },
  { label: "Чт", color: "#ede9fe", border: "#8b5cf6" },
  { label: "Пт", color: "#ffe4e6", border: "#f43f5e" },
  { label: "Сб", color: "#ccfbf1", border: "#14b8a6" },
  { label: "Вс", color: "#f5f5f5", border: "#737373" },
];

export function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function daysInYear(year: number) {
  const days: Date[] = [];
  for (
    const current = new Date(year, 0, 1);
    current.getFullYear() === year;
    current.setDate(current.getDate() + 1)
  ) {
    days.push(new Date(current));
  }
  return days;
}

export function calculateAge(birthDate: string, onDate: string) {
  const birth = new Date(`${birthDate}T00:00:00`);
  const current = new Date(`${onDate}T00:00:00`);
  let result = current.getFullYear() - birth.getFullYear();
  const monthDelta = current.getMonth() - birth.getMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && current.getDate() < birth.getDate())
  ) {
    result -= 1;
  }
  return result;
}

export function weekdayMeta(date: Date | string) {
  const day = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  return weekdays[(day.getDay() || 7) - 1];
}

export function dayTitle(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

export function nextWeekDays(fromDate: string) {
  const start = new Date(`${fromDate}T00:00:00`);
  start.setDate(start.getDate() + 1);
  const weekday = start.getDay() || 7;
  start.setDate(start.getDate() + (8 - weekday));
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return dateKey(day);
  });
}
