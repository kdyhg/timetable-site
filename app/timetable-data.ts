export type TimetableDay = [string, string, string, string, string, string, string];

export type StudentTimetable = [
  TimetableDay,
  TimetableDay,
  TimetableDay,
  TimetableDay,
  TimetableDay,
];

export const periodTimes = [
  { period: 1, start: "08:40", end: "09:30" },
  { period: 2, start: "09:40", end: "10:30" },
  { period: 3, start: "10:40", end: "11:30" },
  { period: 4, start: "11:40", end: "12:30" },
  { period: 5, start: "13:30", end: "14:20" },
  { period: 6, start: "14:30", end: "15:20" },
  { period: 7, start: "15:40", end: "16:30" },
] as const;

const emptyDay = (): TimetableDay => ["", "", "", "", "", "", ""];
const emptyTimetable = (): StudentTimetable => [
  emptyDay(),
  emptyDay(),
  emptyDay(),
  emptyDay(),
  emptyDay(),
];

export const studentTimetables: Record<string, StudentTimetable> =
  Object.fromEntries(
    Array.from({ length: 24 }, (_, index) => [
      `210${String(index + 1).padStart(2, "0")}`,
      emptyTimetable(),
    ]),
  );

export const timetableTemplatePath =
  "/timetables/해강고_2학년10반_시간표_입력양식.xlsx";
