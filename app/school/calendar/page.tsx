import { AcademicCalendar } from "@/components/academic-calendar";

export const revalidate = 3600;

export default function CalendarPage() {
  const initialDate = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return <AcademicCalendar initialDate={initialDate} />;
}
