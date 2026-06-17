import type { AcademicCalendarEvent } from "@/app/academic-calendar-data";

export const OFFICE_CODE = process.env.NEXT_PUBLIC_OFFICE_CODE || "C10";
export const SCHOOL_CODE = process.env.NEXT_PUBLIC_SCHOOL_CODE || "7150404";

export const allergenLabels: Record<number, string> = {
  1: "난류",
  2: "우유",
  3: "메밀",
  4: "땅콩",
  5: "대두",
  6: "밀",
  7: "고등어",
  8: "게",
  9: "새우",
  10: "돼지고기",
  11: "복숭아",
  12: "토마토",
  13: "아황산류",
  14: "호두",
  15: "닭고기",
  16: "쇠고기",
  17: "오징어",
  18: "조개류",
  19: "잣",
};

export type Meal = {
  type: string;
  menuItems: string[];
  allergenNumbers: number[];
  allergenNames: string[];
  calorie: string;
  nutrition: string[];
  origin: string[];
  loadDate: string;
};
type MealApiRow = {
  MMEAL_SC_NM: string;
  DDISH_NM: string;
  ORPLC_INFO?: string;
  CAL_INFO?: string;
  NTR_INFO?: string;
  LOAD_DTM?: string;
};
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

const splitHtmlLines = (value = "") =>
  value
    .split(/<br\s*\/?>/gi)
    .map((line) => line.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
    .filter((line) => line && !/^비고\s*:\s*$/.test(line));

const formatNeisDate = (value = "") =>
  value.length === 8
    ? `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6)}`
    : value;

const parseMealMenu = (menu: string) => {
  const allergenSet = new Set<number>();
  const menuItems = splitHtmlLines(menu)
    .map((line) => {
      const withoutSchoolMarks = line.replace(/\((?:해강|해|강)\)/g, " ");
      const withoutAllergenNumbers = withoutSchoolMarks.replace(
        /\(([\d.\s]+)\)/g,
        (_, numbers: string) => {
          numbers
            .split(".")
            .map((number) => Number(number.trim()))
            .filter((number) => Number.isInteger(number) && allergenLabels[number])
            .forEach((number) => allergenSet.add(number));
          return " ";
        },
      );

      return withoutAllergenNumbers.replace(/\s+/g, " ").trim();
    })
    .filter(Boolean);

  const allergenNumbers = Array.from(allergenSet).sort((a, b) => a - b);

  return {
    menuItems,
    allergenNumbers,
    allergenNames: allergenNumbers.map((number) => allergenLabels[number]),
  };
};

export const cleanMealMenu = (menu: string) => parseMealMenu(menu).menuItems.join(", ");

export const formatMealAllergenWarning = (
  meal: Pick<Meal, "type" | "allergenNames">,
  dateLabel = "오늘",
) =>
  meal.allergenNames.length
    ? `${dateLabel} ${meal.type}에는 ${meal.allergenNames.join(", ")}가 포함될 수 있어요.`
    : `${meal.type}에는 표시된 알레르기 정보가 없습니다.`;

export async function fetchMeals(dateString: string): Promise<Meal[]> {
  const formattedDate = dateString.replace(/-/g, "");
  const response = await fetch(
    `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${formattedDate}`,
  );
  const data = (await response.json()) as MealApiResponse;

  return data.mealServiceDietInfo
    ? data.mealServiceDietInfo[1].row.map((row) => {
        const parsedMenu = parseMealMenu(row.DDISH_NM);

        return {
          type: row.MMEAL_SC_NM,
          menuItems: parsedMenu.menuItems,
          allergenNumbers: parsedMenu.allergenNumbers,
          allergenNames: parsedMenu.allergenNames,
          calorie: row.CAL_INFO || "",
          nutrition: splitHtmlLines(row.NTR_INFO),
          origin: splitHtmlLines(row.ORPLC_INFO),
          loadDate: formatNeisDate(row.LOAD_DTM),
        };
      })
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
