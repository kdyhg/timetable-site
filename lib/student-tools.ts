import type { AcademicCalendarEvent } from "@/app/academic-calendar-data";
import {
  periodTimes,
  studentTimetables,
  type StudentTimetable,
} from "@/app/timetable-data";
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
  studentId: string | null;
};

const minutesOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();
const parseTime = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const offDayPattern =
  /공휴일|휴업일|연휴|선거일|어린이날|한글날|성탄절|신정|제헌절/;

const subjectAt = (
  timetable: StudentTimetable | undefined,
  weekday: number,
  period: number | null,
) => {
  if (!timetable || weekday < 1 || weekday > 5 || !period) return null;
  return timetable[weekday - 1][period - 1] || null;
};

export function getSchoolTimeState(
  now: Date,
  studentId: string | null,
  academicEvents: AcademicCalendarEvent[],
): SchoolTimeState {
  const weekday = now.getDay();
  const today = getLocalDateString(now);
  const timetable = studentId ? studentTimetables[studentId] : undefined;
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
      studentId,
    };
  }

  const currentMinutes = minutesOfDay(now);
  for (const item of periodTimes) {
    const start = parseTime(item.start);
    const end = parseTime(item.end);
    if (currentMinutes >= start && currentMinutes < end) {
      return {
        status: "class",
        label: `${item.period}교시 수업 중`,
        period: item.period,
        subject: subjectAt(timetable, weekday, item.period),
        nextPeriod: item.period < 7 ? item.period + 1 : null,
        nextSubject: subjectAt(
          timetable,
          weekday,
          item.period < 7 ? item.period + 1 : null,
        ),
        remainingMinutes: end - currentMinutes,
        studentId,
      };
    }
    if (currentMinutes < start) {
      return {
        status: item.period === 1 ? "before" : "break",
        label: item.period === 1 ? "수업 시작 전" : "쉬는 시간",
        period: null,
        subject: null,
        nextPeriod: item.period,
        nextSubject: subjectAt(timetable, weekday, item.period),
        remainingMinutes: start - currentMinutes,
        studentId,
      };
    }
  }

  return {
    status: "after",
    label: "오늘 수업 종료",
    period: null,
    subject: null,
    nextPeriod: null,
    nextSubject: null,
    remainingMinutes: null,
    studentId,
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
