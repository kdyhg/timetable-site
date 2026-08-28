import type { AcademicCalendarEvent } from "@/app/academic-calendar-data";

export const eveningStudyWeekdays = [
  { key: "monday", label: "월" },
  { key: "tuesday", label: "화" },
  { key: "wednesday", label: "수" },
  { key: "thursday", label: "목" },
  { key: "friday", label: "금" },
] as const;

export type EveningStudyWeekday = (typeof eveningStudyWeekdays)[number]["key"];
export const eveningStudyCodes = ["", "8", "1", "2"] as const;
export type EveningStudyCode = (typeof eveningStudyCodes)[number];
export type EveningStudySessionCode = Exclude<EveningStudyCode, "">;

export type EveningStudyStudent = {
  id: number;
  classNumber: string;
  maskedName: string;
  monday: EveningStudyCode;
  tuesday: EveningStudyCode;
  wednesday: EveningStudyCode;
  thursday: EveningStudyCode;
  friday: EveningStudyCode;
};

export type EveningStudySession = {
  code: EveningStudySessionCode;
  label: string;
  start: string;
  end: string;
};

export type EveningStudySettings = {
  effectiveDate: string;
  updatedAt: string;
  sessions: Record<EveningStudySessionCode, EveningStudySession>;
};

export type EveningStudyData = {
  settings: EveningStudySettings;
  students: EveningStudyStudent[];
  source: "database" | "default";
};

export type EveningStudyGroup = EveningStudySession & {
  students: EveningStudyStudent[];
};

export const defaultEveningStudyData: EveningStudyData = {
  source: "default",
  settings: {
    effectiveDate: "2026-08-28",
    updatedAt: "2026-08-28T00:00:00+09:00",
    sessions: {
      "8": { code: "8", label: "8교시까지", start: "16:40", end: "17:30" },
      "1": { code: "1", label: "야자 1차시까지", start: "18:30", end: "19:40" },
      "2": { code: "2", label: "야자 2차시까지", start: "19:50", end: "21:00" },
    },
  },
  students: [
    { id: 1, classNumber: "03", maskedName: "김*언", monday: "1", tuesday: "2", wednesday: "1", thursday: "2", friday: "1" },
    { id: 2, classNumber: "04", maskedName: "김*연", monday: "8", tuesday: "8", wednesday: "8", thursday: "8", friday: "8" },
    { id: 3, classNumber: "12", maskedName: "박*원", monday: "2", tuesday: "1", wednesday: "1", thursday: "8", friday: "2" },
    { id: 4, classNumber: "16", maskedName: "송*우", monday: "", tuesday: "2", wednesday: "", thursday: "2", friday: "2" },
    { id: 5, classNumber: "18", maskedName: "이*", monday: "8", tuesday: "8", wednesday: "8", thursday: "8", friday: "8" },
    { id: 6, classNumber: "20", maskedName: "이*수", monday: "8", tuesday: "8", wednesday: "8", thursday: "8", friday: "8" },
    { id: 7, classNumber: "21", maskedName: "좌*윤", monday: "8", tuesday: "8", wednesday: "8", thursday: "8", friday: "8" },
    { id: 8, classNumber: "22", maskedName: "진*랑", monday: "", tuesday: "2", wednesday: "", thursday: "2", friday: "2" },
  ],
};

const weekdayByShortName: Record<string, EveningStudyWeekday> = {
  Mon: "monday",
  Tue: "tuesday",
  Wed: "wednesday",
  Thu: "thursday",
  Fri: "friday",
};

const noStudyDayPattern =
  /공휴일|휴업일|연휴|선거일|어린이날|한글날|성탄절|신정|제헌절|방학/;

export const getKoreanDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
};

export const getEveningStudyWeekday = (
  date = new Date(),
): EveningStudyWeekday | null => {
  const shortName = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).format(date);
  return weekdayByShortName[shortName] ?? null;
};

export function getEveningStudyOffReason(
  date: Date,
  academicEvents: AcademicCalendarEvent[],
) {
  if (!getEveningStudyWeekday(date)) return "주말에는 야간자율학습이 없습니다.";
  const dateKey = getKoreanDateKey(date);
  const noStudyEvent = academicEvents.find(
    (event) =>
      event.date <= dateKey &&
      (event.endDate ?? event.date) >= dateKey &&
      noStudyDayPattern.test(event.title),
  );
  return noStudyEvent ? `${noStudyEvent.title}에는 야간자율학습이 없습니다.` : null;
}

export function getEveningStudyGroups(
  data: EveningStudyData,
  weekday: EveningStudyWeekday,
): EveningStudyGroup[] {
  return (["8", "1", "2"] as const).map((code) => ({
    ...data.settings.sessions[code],
    students: data.students
      .filter((student) => student[weekday] === code)
      .sort((a, b) => a.classNumber.localeCompare(b.classNumber, "ko")),
  }));
}

export const formatMaskedStudent = (student: EveningStudyStudent) =>
  `${student.classNumber} ${student.maskedName}`;

export const formatEveningStudyDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return `${year}년 ${month}월 ${day}일`;
};

export const normalizeClassNumber = (value: unknown) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? digits.slice(-2).padStart(2, "0") : "";
};

export const maskStudentName = (value: unknown) => {
  const name = String(value ?? "").trim().replace(/\s+/g, "");
  if (!name) return "";
  if (name.includes("*")) return name;
  if (name.length <= 2) return `${name[0]}*`;
  return `${name[0]}${"*".repeat(Math.max(1, name.length - 2))}${name.at(-1)}`;
};

export const normalizeEveningStudyCode = (value: unknown): EveningStudyCode =>
  eveningStudyCodes.includes(value as EveningStudyCode)
    ? (value as EveningStudyCode)
    : "";
