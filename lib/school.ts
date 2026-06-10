import type { AcademicCalendarEvent } from "@/app/academic-calendar-data";

export const OFFICE_CODE = process.env.NEXT_PUBLIC_OFFICE_CODE || "C10";
export const SCHOOL_CODE = process.env.NEXT_PUBLIC_SCHOOL_CODE || "7150404";

export type Meal = { type: string; menu: string };
type MealApiRow = { MMEAL_SC_NM: string; DDISH_NM: string };
type MealApiResponse = {
  mealServiceDietInfo?: [unknown, { row: MealApiRow[] }];
};

export const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

export const startOfWeek = (date = new Date()) => {
  const start = parseLocalDate(getLocalDateString(date));
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start;
};

export const endOfWeek = (date = new Date()) => addDays(startOfWeek(date), 6);

export const isDateInRange = (
  dateString: string,
  start: Date,
  end: Date,
  endDateString?: string | null,
) => {
  const itemStart = parseLocalDate(dateString);
  const itemEnd = parseLocalDate(endDateString || dateString);
  return itemStart <= end && itemEnd >= start;
};

export const formatDateString = (dateString: string, endDate?: string | null) =>
  formatAcademicDate({
    id: dateString,
    semester: "1학기",
    date: dateString,
    endDate: endDate || undefined,
    title: "",
  });

export const cleanMealMenu = (menu: string) =>
  menu.replace(/[0-9.]/g, "").replace(/<br\/?>/g, ", ");

export async function fetchMeals(dateString: string): Promise<Meal[]> {
  const formattedDate = dateString.replace(/-/g, "");
  const response = await fetch(
    `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${formattedDate}`,
  );
  const data = (await response.json()) as MealApiResponse;

  return data.mealServiceDietInfo
    ? data.mealServiceDietInfo[1].row.map((row) => ({
        type: row.MMEAL_SC_NM,
        menu: cleanMealMenu(row.DDISH_NM),
      }))
    : [];
}

export const formatAcademicDate = (event: AcademicCalendarEvent) => {
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const startDate = parseLocalDate(event.date);
  const start = `${startDate.getMonth() + 1}월 ${startDate.getDate()}일(${weekdays[startDate.getDay()]})`;

  if (!event.endDate) return start;

  const endDate = parseLocalDate(event.endDate);
  return `${start} ~ ${endDate.getMonth() + 1}월 ${endDate.getDate()}일(${weekdays[endDate.getDay()]})`;
};

export const upcomingEvents = (
  events: AcademicCalendarEvent[],
  days = 7,
  now = new Date(),
) => {
  const start = parseLocalDate(getLocalDateString(now));
  const end = addDays(start, days);

  return events.filter((event) => {
    const eventStart = parseLocalDate(event.date);
    const eventEnd = parseLocalDate(event.endDate ?? event.date);
    return eventStart <= end && eventEnd >= start;
  });
};
