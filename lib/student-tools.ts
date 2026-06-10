import type { AcademicCalendarEvent } from "@/app/academic-calendar-data";
import { classTimetable, periodTimes } from "@/app/timetable-data";
import { addDays, getLocalDateString, parseLocalDate } from "@/lib/school";

export const STUDENT_ID_STORAGE_KEY = "haegang-student-id";

export type SchoolTimeState = {
  status: "class" | "break" | "before" | "after" | "off";
  label: string;
  period: number | null;
  subject: string | null;
  nextPeriod: number | null;
  nextSubject: string | null;
  remainingMinutes: number | null;
};

const minutesOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();
const parseTime = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const offDayPattern =
  /공휴일|휴업일|연휴|선거일|어린이날|한글날|성탄절|신정|제헌절/;

const subjectAt = (weekday: number, period: number | null) => {
  if (weekday < 1 || weekday > 5 || !period) return null;
  return classTimetable[weekday - 1][period - 1].trim() || null;
};

export function getSchoolTimeState(
  now: Date,
  academicEvents: AcademicCalendarEvent[],
): SchoolTimeState {
  const weekday = now.getDay();
  const today = getLocalDateString(now);
  const offDay =
    weekday === 0 ||
    weekday === 6 ||
    academicEvents.some(
      (event) =>
        event.date <= today &&
        (event.endDate ?? event.date) >= today &&
        (event.title === "방학" || offDayPattern.test(event.title)),
    );

  if (offDay) {
    return {
      status: "off",
      label: weekday === 0 || weekday === 6 ? "주말" : "수업 없는 날",
      period: null,
      subject: null,
      nextPeriod: null,
      nextSubject: null,
      remainingMinutes: null,
    };
  }

  const currentMinutes = minutesOfDay(now);
  const todaysClasses = periodTimes
    .map((item) => ({
      ...item,
      startMinutes: parseTime(item.start),
      endMinutes: parseTime(item.end),
      subject: subjectAt(weekday, item.period),
    }))
    .filter((item) => item.subject);
  const current = todaysClasses.find(
    (item) =>
      currentMinutes >= item.startMinutes && currentMinutes < item.endMinutes,
  );

  if (current) {
    const next = todaysClasses.find(
      (item) => item.startMinutes > current.startMinutes,
    );
    return {
      status: "class",
      label: `${current.period}교시 수업 중`,
      period: current.period,
      subject: current.subject,
      nextPeriod: next?.period ?? null,
      nextSubject: next?.subject ?? null,
      remainingMinutes: current.endMinutes - currentMinutes,
    };
  }

  const next = todaysClasses.find((item) => item.startMinutes > currentMinutes);
  if (next) {
    return {
      status: next.period === todaysClasses[0]?.period ? "before" : "break",
      label:
        next.period === todaysClasses[0]?.period ? "수업 시작 전" : "쉬는 시간",
      period: null,
      subject: null,
      nextPeriod: next.period,
      nextSubject: next.subject,
      remainingMinutes: next.startMinutes - currentMinutes,
    };
  }

  return {
    status: "after",
    label: "오늘 수업 종료",
    period: null,
    subject: null,
    nextPeriod: null,
    nextSubject: null,
    remainingMinutes: null,
  };
}

export type ExamFocus = {
  title: string;
  start: string;
  end: string;
  daysUntil: number;
};

export function getExamFocus(
  events: AcademicCalendarEvent[],
  now = new Date(),
): ExamFocus | null {
  const today = parseLocalDate(getLocalDateString(now));
  const examEvents = events.filter((event) => event.title.includes("고사"));
  const active = examEvents
    .filter((event) => {
      const start = parseLocalDate(event.date);
      const end = parseLocalDate(event.endDate ?? event.date);
      return today >= addDays(start, -14) && today <= end;
    })
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  if (!active) return null;

  const related = examEvents.filter((event) => {
    const gap = Math.abs(
      (parseLocalDate(event.date).getTime() -
        parseLocalDate(active.date).getTime()) /
        86_400_000,
    );
    return event.title === active.title && gap <= 7;
  });
  const start = related.map((event) => event.date).sort()[0];
  const end = related
    .map((event) => event.endDate ?? event.date)
    .sort()
    .at(-1) as string;
  const daysUntil = Math.max(
    0,
    Math.ceil(
      (parseLocalDate(start).getTime() - today.getTime()) / 86_400_000,
    ),
  );

  return { title: active.title, start, end, daysUntil };
}

export const getDaysUntil = (dateString: string, now = new Date()) =>
  Math.ceil(
    (parseLocalDate(dateString).getTime() -
      parseLocalDate(getLocalDateString(now)).getTime()) /
      86_400_000,
  );
