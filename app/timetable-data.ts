export type TimetableDay = [string, string, string, string, string, string, string];

export type ClassTimetable = [
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

export const classTimetable: ClassTimetable = [
  ["화법", "미적", "가정", "일본어", "영어", "B", "A"],
  ["영어", "화법", "C", "진독", "미적", "A", "B"],
  ["기술", "진로", "영어", "C", "HR", "HR", ""],
  ["A", "일본어", "화법", "미적", "기술", "음악", "B"],
  ["화법", "체육", "C", "미적", "일본어", "영어", "음악"],
];

export const validStudentIds = Array.from(
  { length: 24 },
  (_, index) => `210${String(index + 1).padStart(2, "0")}`,
).filter((studentId) => studentId !== "21006");
