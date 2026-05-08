export function normalizeText(value: string | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function fullName(parts: {
  lastName: string;
  firstName: string;
  middleName?: string;
}) {
  return [parts.lastName, parts.firstName, parts.middleName]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ");
}

export function searchText(...parts: Array<string | undefined>) {
  return normalizeText(parts.filter(Boolean).join(" "));
}

export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateAge(birthDate: string | undefined, onDate: string) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00`);
  const current = new Date(`${onDate}T00:00:00`);
  let age = current.getFullYear() - birth.getFullYear();
  const monthDelta = current.getMonth() - birth.getMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && current.getDate() < birth.getDate())
  ) {
    age -= 1;
  }
  return age;
}

export function weekRangeAfter(date: string) {
  const start = new Date(`${date}T00:00:00`);
  start.setDate(start.getDate() + 1);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() + (8 - day));

  const days: string[] = [];
  for (let index = 0; index < 7; index += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    days.push(dateKey(current));
  }
  return days;
}
