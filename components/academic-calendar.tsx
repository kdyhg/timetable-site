"use client";

import {
  academicCalendarEvents,
  type AcademicCalendarEvent,
  type AcademicSemester,
} from "@/app/academic-calendar-data";
import { PageHeader } from "@/components/page-header";
import {
  addDays,
  formatAcademicDate,
  getLocalDateString,
  parseLocalDate,
  upcomingEvents,
} from "@/lib/school";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  List,
} from "lucide-react";
import { useMemo, useState } from "react";

type Filter = "all" | AcademicSemester;
type ViewMode = "month" | "list";

const weekdays = ["월", "화", "수", "목", "금", "토", "일"];

const getInitialFilter = (today: string): Filter => {
  return (
    academicCalendarEvents.find(
      (event) => (event.endDate ?? event.date) >= today,
    )?.semester ?? "all"
  );
};

const getInitialMonth = (initialDate: string) => {
  const today = parseLocalDate(initialDate);
  const firstEvent = academicCalendarEvents[0];
  const lastEvent = academicCalendarEvents.at(-1);
  const todayKey = initialDate;
  const withinAcademicYear =
    firstEvent && lastEvent && todayKey >= firstEvent.date && todayKey <= (lastEvent.endDate ?? lastEvent.date);
  const reference = withinAcademicYear
    ? today
    : parseLocalDate(
        academicCalendarEvents.find((event) => (event.endDate ?? event.date) >= todayKey)?.date ??
          lastEvent?.date ??
          todayKey,
      );
  return new Date(reference.getFullYear(), reference.getMonth(), 1);
};

const getEventsForDate = (date: string) =>
  academicCalendarEvents.filter(
    (event) => event.date <= date && (event.endDate ?? event.date) >= date,
  );

const eventTone = (title: string) => {
  if (/고사|학평|모평|수능|평가/.test(title)) {
    return { dot: "bg-[#d9485f]", label: "bg-[#fff0f2] text-[#a72f44]" };
  }
  if (/공휴일|휴업일|휴일|방학|신정|추석|성탄절|한글날|제헌절|선거일/.test(title)) {
    return { dot: "bg-[#787774]", label: "bg-[#f1f1ef] text-[#615d59]" };
  }
  if (/진로|진학|교육과정/.test(title)) {
    return { dot: "bg-[#c26a00]", label: "bg-[#fff6e6] text-[#8a4b00]" };
  }
  return { dot: "bg-[#0075de]", label: "bg-[#e8f3fc] text-[#005bab]" };
};

const formatSelectedDate = (date: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(parseLocalDate(date));

function EventRow({ event }: { event: AcademicCalendarEvent }) {
  const tone = eventTone(event.title);
  return (
    <div className="flex gap-3 py-3">
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
      <div className="min-w-0">
        <p className="text-xs text-[#787774]">{formatAcademicDate(event)}</p>
        <p className="mt-1 break-words text-sm font-medium leading-6">{event.title}</p>
      </div>
    </div>
  );
}

export function AcademicCalendar({ initialDate }: { initialDate: string }) {
  const [filter, setFilter] = useState<Filter>(() => getInitialFilter(initialDate));
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [monthCursor, setMonthCursor] = useState(() => getInitialMonth(initialDate));
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const upcoming = useMemo(
    () => upcomingEvents(academicCalendarEvents, 7, parseLocalDate(initialDate)),
    [initialDate],
  );

  const calendarDays = useMemo(() => {
    const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = addDays(first, -mondayOffset);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [monthCursor]);

  const monthKey = `${monthCursor.getFullYear()}-${String(monthCursor.getMonth() + 1).padStart(2, "0")}`;
  const monthEvents = useMemo(
    () =>
      academicCalendarEvents.filter(
        (event) => event.date.startsWith(monthKey) || (event.endDate ?? "").startsWith(monthKey),
      ),
    [monthKey],
  );
  const selectedEvents = getEventsForDate(selectedDate);

  const groups = useMemo(() => {
    const filtered = academicCalendarEvents.filter(
      (event) => filter === "all" || event.semester === filter,
    );
    return (["1학기", "2학기"] as AcademicSemester[])
      .map((semester) => ({
        semester,
        months: Array.from(
          filtered
            .filter((event) => event.semester === semester)
            .reduce((map, event) => {
              const month = `${parseLocalDate(event.date).getMonth() + 1}월`;
              map.set(month, [...(map.get(month) ?? []), event]);
              return map;
            }, new Map<string, AcademicCalendarEvent[]>()),
        ),
      }))
      .filter((group) => group.months.length);
  }, [filter]);

  const moveMonth = (offset: number) => {
    const next = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + offset, 1);
    setMonthCursor(next);
    const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    const firstEvent = academicCalendarEvents.find((event) => event.date.startsWith(nextKey));
    setSelectedDate(firstEvent?.date ?? `${nextKey}-01`);
  };

  const goToday = () => {
    const today = new Date();
    setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(getLocalDateString(today));
  };

  return (
    <>
      <PageHeader
        title="학사일정"
        description="2026학년도 일정을 달력으로 보고, 필요한 때에는 학기별 목록으로 바꿔 확인하세요."
        crumbs={[
          { label: "홈", href: "/" },
          { label: "학교생활" },
          { label: "학사일정" },
        ]}
        actions={
          <div className="flex gap-1 rounded-lg border border-[#e6e6e6] bg-white p-1" role="group" aria-label="달력 보기 방식">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium ${viewMode === "month" ? "bg-[#e9e9e7]" : "text-[#787774] hover:bg-[#f3f3f2]"}`}
            >
              <CalendarDays className="h-4 w-4" /> 월간
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium ${viewMode === "list" ? "bg-[#e9e9e7]" : "text-[#787774] hover:bg-[#f3f3f2]"}`}
            >
              <List className="h-4 w-4" /> 목록
            </button>
          </div>
        }
      />

      {viewMode === "month" ? (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => moveMonth(-1)} className="touch-icon-button hover:bg-[#e9e9e7]" aria-label="이전 달" title="이전 달">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => moveMonth(1)} className="touch-icon-button hover:bg-[#e9e9e7]" aria-label="다음 달" title="다음 달">
                <ChevronRight className="h-5 w-5" />
              </button>
              <h2 className="ml-1 text-xl font-bold sm:text-2xl">
                {monthCursor.getFullYear()}년 {monthCursor.getMonth() + 1}월
              </h2>
            </div>
            <button type="button" onClick={goToday} className="notion-button px-3">오늘</button>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="notion-card overflow-hidden" aria-label={`${monthCursor.getFullYear()}년 ${monthCursor.getMonth() + 1}월 달력`}>
              <div className="grid grid-cols-7 border-b border-[#e6e6e6] bg-[#fbfbfa]">
                {weekdays.map((weekday, index) => (
                  <div key={weekday} className={`py-2 text-center text-xs font-semibold ${index >= 5 ? "text-[#a85448]" : "text-[#787774]"}`}>
                    {weekday}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((date) => {
                  const dateKey = getLocalDateString(date);
                  const events = getEventsForDate(dateKey);
                  const inMonth = date.getMonth() === monthCursor.getMonth();
                  const selected = dateKey === selectedDate;
                  const today = dateKey === initialDate;
                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => setSelectedDate(dateKey)}
                      aria-pressed={selected}
                      aria-label={`${formatSelectedDate(dateKey)}, 일정 ${events.length}개`}
                      className={`relative min-h-16 border-b border-r border-[#e6e6e6] p-1.5 text-left align-top transition-colors sm:min-h-24 sm:p-2 ${
                        selected ? "bg-[#e8f3fc]" : "hover:bg-[#fbfbfa]"
                      } ${inMonth ? "text-[#191919]" : "bg-[#fafaf9] text-[#c2bfba]"}`}
                    >
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${today ? "bg-[#191919] text-white" : ""}`}>
                        {date.getDate()}
                      </span>
                      <span className="mt-1 flex gap-1 sm:hidden">
                        {events.slice(0, 3).map((event) => (
                          <span key={event.id} className={`h-1.5 w-1.5 rounded-full ${eventTone(event.title).dot}`} />
                        ))}
                      </span>
                      <span className="mt-1 hidden space-y-1 sm:block">
                        {events.slice(0, 2).map((event) => (
                          <span key={event.id} className={`block truncate rounded px-1.5 py-1 text-[11px] font-medium ${eventTone(event.title).label}`}>
                            {event.title}
                          </span>
                        ))}
                        {events.length > 2 && <span className="block text-[10px] text-[#787774]">+{events.length - 2}개</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <aside className="notion-card overflow-hidden">
              <div className="border-b border-[#e6e6e6] bg-[#fbfbfa] px-4 py-3">
                <p className="text-sm font-semibold">{formatSelectedDate(selectedDate)}</p>
              </div>
              <div className="divide-y divide-[#e6e6e6] px-4">
                {selectedEvents.length ? (
                  selectedEvents.map((event) => <EventRow key={event.id} event={event} />)
                ) : (
                  <p className="py-5 text-sm text-[#787774]">등록된 학사일정이 없습니다.</p>
                )}
              </div>
              <div className="border-t border-[#e6e6e6] px-4 py-3 text-xs text-[#787774]">
                이번 달 일정 {monthEvents.length}개
              </div>
            </aside>
          </div>
        </>
      ) : (
        <>
          <div className="mb-6 flex max-w-full gap-1 overflow-x-auto rounded-lg border border-[#e6e6e6] bg-white p-1 sm:w-fit">
            {(["all", "1학기", "2학기"] as Filter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`min-h-11 shrink-0 rounded-md px-4 text-sm font-medium ${filter === item ? "bg-[#e9e9e7]" : "text-[#787774] hover:bg-[#f3f3f2]"}`}
              >
                {item === "all" ? "전체" : item}
              </button>
            ))}
          </div>

          {upcoming.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-semibold">다가오는 7일</h2>
              <div className="notion-card grid divide-y divide-[#e6e6e6] md:grid-cols-2 md:divide-x md:divide-y-0">
                {upcoming.map((event) => (
                  <div key={event.id} className="flex gap-3 p-4">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#0075de]" />
                    <div>
                      <p className="text-xs text-[#787774]">{formatAcademicDate(event)}</p>
                      <p className="mt-1 text-sm font-medium">{event.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.semester}>
                <h2 className="mb-3 text-xl font-semibold">{group.semester}</h2>
                <div className="space-y-4">
                  {group.months.map(([month, events]) => (
                    <div key={month} className="notion-card overflow-hidden">
                      <div className="border-b border-[#e6e6e6] bg-[#fbfbfa] px-5 py-3 text-sm font-semibold">{month}</div>
                      <div className="divide-y divide-[#e6e6e6]">
                        {events.map((event) => (
                          <div key={event.id} className="grid gap-1 px-5 py-3 text-sm md:grid-cols-[230px_1fr]">
                            <time className="text-[#787774]">{formatAcademicDate(event)}</time>
                            <p className="font-medium">{event.title}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}
