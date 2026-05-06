export type StatEntry = { name: string; value: number };

export type Dashboard = {
  total: number;
  confirmed: number;
  unconfirmed: number;
  bySource: StatEntry[];
  byFinancing: StatEntry[];
  byVisitType: StatEntry[];
  byDiagnosis: StatEntry[];
  byDepartment: StatEntry[];
  timeline: Array<{ date: string; value: number }>;
};
