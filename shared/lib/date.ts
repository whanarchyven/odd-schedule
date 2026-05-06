export function formatDateRu(value?: string | null) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
}

export function formatDateTimeRu(value: number) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatWeekdayRu(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const weekday = date.toLocaleDateString("ru-RU", { weekday: "long" });
  return weekday.slice(0, 1).toUpperCase() + weekday.slice(1);
}
