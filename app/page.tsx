"use client";

import { academicCalendarEvents } from "@/app/academic-calendar-data";
import { NoticeMeta } from "@/components/content-ui";
import { EmptyState, SectionTitle } from "@/components/ui";
import { parseApiResponse } from "@/lib/client-api";
import {
  isVisibleNotice,
  type ClassItem,
  type Notice,
} from "@/lib/content";
import {
  addDays,
  fetchMeals,
  formatAcademicDate,
  formatDateString,
  getLocalDateString,
  isDateInRange,
  parseLocalDate,
  upcomingEvents,
} from "@/lib/school";
import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function HomePage() {
  const today = getLocalDateString();
  const [meal, setMeal] = useState("급식 정보를 불러오는 중입니다.");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [items, setItems] = useState<ClassItem[]>([]);
  const [managedError, setManagedError] = useState("");
  const todayDate = useMemo(() => parseLocalDate(today), [today]);
  const nextWeek = useMemo(() => addDays(todayDate, 7), [todayDate]);
  const academicToday = academicCalendarEvents.filter((event) =>
    isDateInRange(event.date, todayDate, todayDate, event.endDate),
  );
  const academicUpcoming = upcomingEvents(academicCalendarEvents).filter(
    (event) => !academicToday.some((todayEvent) => todayEvent.id === event.id),
  );
  const important = notices.filter(
    (notice) => notice.is_important && isVisibleNotice(notice, today),
  );
  const upcomingItems = items.filter((item) =>
    isDateInRange(item.date, todayDate, nextWeek, item.end_date),
  );

  useEffect(() => {
    fetchMeals(today)
      .then((rows) =>
        setMeal(
          rows.map((row) => `${row.type} · ${row.menu}`).join("\n") ||
            "오늘은 급식 정보가 없습니다.",
        ),
      )
      .catch(() => setMeal("급식 정보를 불러오지 못했습니다."));
    Promise.allSettled([
      parseApiResponse<Notice[]>(fetch("/api/notices", { cache: "no-store" })),
      parseApiResponse<ClassItem[]>(fetch("/api/class-items", { cache: "no-store" })),
    ]).then(([noticeResult, itemResult]) => {
      if (noticeResult.status === "fulfilled") setNotices(noticeResult.value);
      if (itemResult.status === "fulfilled") setItems(itemResult.value);
      if (noticeResult.status === "rejected" || itemResult.status === "rejected") {
        setManagedError("담임 등록 정보 일부를 불러오지 못했습니다. 학사일정과 급식은 계속 확인할 수 있습니다.");
      }
    });
  }, [today]);

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-semibold text-[#0075de]">
          {new Date().toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">오늘의 학급</h1>
        <p className="mt-3 text-[15px] text-[#615d59]">
          오늘 해야 할 일과 이번 주의 중요한 안내를 한눈에 확인하세요.
        </p>
      </header>

      {managedError && (
        <p className="mb-6 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          {managedError}
        </p>
      )}

      {important.length > 0 && (
        <section className="mb-8">
          <SectionTitle title="중요 공지" />
          <div className="notion-card divide-y divide-[#e6e6e6] border-l-4 border-l-red-500">
            {important.slice(0, 3).map((notice) => (
              <Link
                href="/school/notices"
                key={notice.id}
                className="block p-4 hover:bg-[#fbfbfa]"
              >
                <NoticeMeta notice={notice} />
                <p className="mt-2 font-semibold">{notice.title}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#615d59]">
                  {notice.content}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-8">
          <section>
            <SectionTitle title="오늘 일정" />
            {academicToday.length || upcomingItems.filter((item) => item.date === today).length ? (
              <div className="notion-card divide-y divide-[#e6e6e6]">
                {academicToday.map((event) => (
                  <Link href="/school/calendar" key={event.id} className="flex gap-3 p-4 hover:bg-[#fbfbfa]">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-[#0075de]" />
                    <div><p className="text-xs text-[#787774]">학사일정</p><p className="mt-1 text-sm font-medium">{event.title}</p></div>
                  </Link>
                ))}
                {upcomingItems.filter((item) => item.date === today).map((item) => (
                  <Link href="/school/assessments" key={item.id} className="flex gap-3 p-4 hover:bg-[#fbfbfa]">
                    <ClipboardCheck className="mt-0.5 h-4 w-4 text-[#0075de]" />
                    <div><p className="text-xs text-[#787774]">{item.item_type}{item.subject ? ` · ${item.subject}` : ""}</p><p className="mt-1 text-sm font-medium">{item.title}</p></div>
                  </Link>
                ))}
              </div>
            ) : <EmptyState title="오늘 등록된 일정이 없습니다." />}
          </section>

          <section>
            <SectionTitle
              title="앞으로 7일"
              action={<Link href="/school/weekly" className="text-sm font-medium text-[#0075de]">주간 브리핑</Link>}
            />
            {academicUpcoming.length || upcomingItems.length ? (
              <div className="notion-card divide-y divide-[#e6e6e6]">
                {upcomingItems.slice(0, 6).map((item) => (
                  <Link href="/school/assessments" key={`item-${item.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-[#fbfbfa]">
                    <div><p className="text-xs text-[#787774]">{item.item_type}{item.subject ? ` · ${item.subject}` : ""}</p><p className="mt-1 text-sm font-medium">{item.title}</p></div>
                    <span className="shrink-0 text-xs text-[#0075de]">{formatDateString(item.date)}</span>
                  </Link>
                ))}
                {academicUpcoming.slice(0, 5).map((event) => (
                  <Link href="/school/calendar" key={`academic-${event.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-[#fbfbfa]">
                    <div><p className="text-xs text-[#787774]">학사일정</p><p className="mt-1 text-sm font-medium">{event.title}</p></div>
                    <span className="shrink-0 text-xs text-[#0075de]">{formatAcademicDate(event)}</span>
                  </Link>
                ))}
              </div>
            ) : <EmptyState title="앞으로 7일 안에 등록된 일정이 없습니다." />}
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <SectionTitle title="오늘의 급식" action={<Link href="/school/meals" className="text-sm font-medium text-[#0075de]">급식 보기</Link>} />
            <div className="notion-card p-5">
              <Utensils className="h-5 w-5 text-[#0075de]" />
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#31302e]">{meal}</p>
            </div>
          </section>
          <section>
            <SectionTitle title="최근 공지" action={<Link href="/school/notices" className="text-sm font-medium text-[#0075de]">전체 공지</Link>} />
            {notices.length ? (
              <div className="notion-card divide-y divide-[#e6e6e6]">
                {notices.filter((notice) => isVisibleNotice(notice, today)).slice(0, 5).map((notice) => (
                  <Link href="/school/notices" key={notice.id} className="flex items-center justify-between gap-3 p-4 hover:bg-[#fbfbfa]">
                    <div><NoticeMeta notice={notice} /><p className="mt-2 text-sm font-medium">{notice.title}</p></div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#a39e98]" />
                  </Link>
                ))}
              </div>
            ) : <EmptyState title="등록된 공지가 없습니다." />}
          </section>
        </div>
      </div>
    </>
  );
}
