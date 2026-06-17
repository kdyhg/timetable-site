"use client";

import { academicCalendarEvents } from "@/app/academic-calendar-data";
import { CurrentPeriodCard } from "@/components/current-period-card";
import { ExamFocusCard } from "@/components/exam-focus-card";
import { NoticeMeta } from "@/components/content-ui";
import { EmptyState, SectionTitle } from "@/components/ui";
import { parseApiResponse } from "@/lib/client-api";
import {
  isVisibleNotice,
  type ClassItem,
  type Notice,
  type RoadmapItem,
} from "@/lib/content";
import {
  addDays,
  fetchMeals,
  formatMealAllergenWarning,
  formatAcademicDate,
  formatDateString,
  getLocalDateString,
  isDateInRange,
  type Meal,
  parseLocalDate,
  upcomingEvents,
} from "@/lib/school";
import { getExamFocus } from "@/lib/student-tools";
import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Map,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function HomePage() {
  const today = getLocalDateString();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealStatus, setMealStatus] = useState("급식 정보를 불러오는 중입니다.");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [items, setItems] = useState<ClassItem[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const todayDate = useMemo(() => parseLocalDate(today), [today]);
  const nextWeek = useMemo(() => addDays(todayDate, 7), [todayDate]);
  const examFocus = getExamFocus(academicCalendarEvents);
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
  const monthRoadmap = roadmaps.find((item) => item.month === today.slice(0, 7));

  useEffect(() => {
    fetchMeals(today)
      .then((rows) => {
        setMeals(rows);
        setMealStatus(rows.length ? "" : "오늘은 급식 정보가 없습니다.");
      })
      .catch(() => {
        setMeals([]);
        setMealStatus("급식 정보를 불러오지 못했습니다.");
      });
    Promise.allSettled([
      parseApiResponse<Notice[]>(fetch("/api/notices", { cache: "no-store" })),
      parseApiResponse<ClassItem[]>(fetch("/api/class-items", { cache: "no-store" })),
      parseApiResponse<RoadmapItem[]>(
        fetch("/api/roadmap-items", { cache: "no-store" }),
      ),
    ]).then(([noticeResult, itemResult, roadmapResult]) => {
      if (noticeResult.status === "fulfilled") setNotices(noticeResult.value);
      if (itemResult.status === "fulfilled") setItems(itemResult.value);
      if (roadmapResult.status === "fulfilled") setRoadmaps(roadmapResult.value);
    });
  }, [today]);

  return (
    <>
      <header className="mb-6 md:mb-8">
        <p className="text-sm font-semibold text-[#0075de]">
          {new Date().toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl md:text-4xl">
          오늘의 학급
        </h1>
        <p className="mt-3 text-[15px] text-[#615d59]">
          지금 수업부터 시험 준비와 이번 주 일정까지 빠르게 확인하세요.
        </p>
      </header>

      {examFocus && <ExamFocusCard focus={examFocus} items={items} />}

      <div className="mb-8 grid gap-5 md:grid-cols-2">
        <CurrentPeriodCard />
        <section className="notion-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[#e6e6e6] px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Map className="h-4 w-4 text-[#0075de]" /> 이번 달 로드맵
            </p>
            <Link href="/school/roadmap" className="text-xs font-semibold text-[#0075de]">
              전체 보기
            </Link>
          </div>
          {monthRoadmap ? (
            <div className="p-5">
              <h2 className="text-lg font-bold">{monthRoadmap.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#615d59]">
                {monthRoadmap.description}
              </p>
              {monthRoadmap.action_points.length > 0 && (
                <p className="mt-4 rounded-md bg-[#f6f5f4] p-3 text-sm">
                  먼저 할 일 · {monthRoadmap.action_points[0]}
                </p>
              )}
            </div>
          ) : (
            <div className="p-5">
              <p className="text-sm leading-6 text-[#787774]">
                이번 달 행동 가이드는 아직 등록되지 않았습니다. 학교 일정은 계속
                확인할 수 있습니다.
              </p>
            </div>
          )}
        </section>
      </div>

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

      <div className="grid gap-8 md:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-8">
          <section>
            <SectionTitle title="오늘 일정" />
            {academicToday.length ||
            upcomingItems.filter((item) => item.date === today).length ? (
              <div className="notion-card divide-y divide-[#e6e6e6]">
                {academicToday.map((event) => (
                  <Link
                    href="/school/calendar"
                    key={event.id}
                    className="flex gap-3 p-4 hover:bg-[#fbfbfa]"
                  >
                    <CalendarDays className="mt-0.5 h-4 w-4 text-[#0075de]" />
                    <div>
                      <p className="text-xs text-[#787774]">학사일정</p>
                      <p className="mt-1 text-sm font-medium">{event.title}</p>
                    </div>
                  </Link>
                ))}
                {upcomingItems
                  .filter((item) => item.date === today)
                  .map((item) => (
                    <Link
                      href="/school/assessments"
                      key={item.id}
                      className="flex gap-3 p-4 hover:bg-[#fbfbfa]"
                    >
                      <ClipboardCheck className="mt-0.5 h-4 w-4 text-[#0075de]" />
                      <div>
                        <p className="text-xs text-[#787774]">
                          {item.item_type}
                          {item.subject ? ` · ${item.subject}` : ""}
                        </p>
                        <p className="mt-1 text-sm font-medium">{item.title}</p>
                      </div>
                    </Link>
                  ))}
              </div>
            ) : (
              <EmptyState title="오늘 등록된 일정이 없습니다." />
            )}
          </section>

          <section>
            <SectionTitle
              title="앞으로 7일"
              action={
                <Link href="/school/weekly" className="text-sm font-medium text-[#0075de]">
                  주간 브리핑
                </Link>
              }
            />
            {academicUpcoming.length || upcomingItems.length ? (
              <div className="notion-card divide-y divide-[#e6e6e6]">
                {upcomingItems.slice(0, 6).map((item) => (
                  <Link
                    href="/school/assessments"
                    key={`item-${item.id}`}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-[#fbfbfa]"
                  >
                    <div>
                      <p className="text-xs text-[#787774]">
                        {item.item_type}
                        {item.subject ? ` · ${item.subject}` : ""}
                      </p>
                      <p className="mt-1 text-sm font-medium">{item.title}</p>
                    </div>
                    <span className="shrink-0 text-xs text-[#0075de]">
                      {formatDateString(item.date)}
                    </span>
                  </Link>
                ))}
                {academicUpcoming.slice(0, 5).map((event) => (
                  <Link
                    href="/school/calendar"
                    key={`academic-${event.id}`}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-[#fbfbfa]"
                  >
                    <div>
                      <p className="text-xs text-[#787774]">학사일정</p>
                      <p className="mt-1 text-sm font-medium">{event.title}</p>
                    </div>
                    <span className="shrink-0 text-xs text-[#0075de]">
                      {formatAcademicDate(event)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="앞으로 7일 안에 등록된 일정이 없습니다." />
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <SectionTitle
              title="오늘의 급식"
              action={
                <Link href="/school/meals" className="text-sm font-medium text-[#0075de]">
                  급식 보기
                </Link>
              }
            />
            <div className="notion-card p-5">
              <Utensils className="h-5 w-5 text-[#0075de]" />
              {meals.length ? (
                <div className="mt-4 space-y-4">
                  {meals.map((meal) => (
                    <div key={meal.type} className="border-t border-[#e6e6e6] pt-4 first:border-t-0 first:pt-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{meal.type}</p>
                        {meal.calorie && (
                          <span className="rounded-full bg-[#f6f5f4] px-2.5 py-1 text-xs text-[#615d59]">
                            {meal.calorie}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[#31302e]">
                        {meal.menuItems.join(", ") || "메뉴 정보가 없습니다."}
                      </p>
                      <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                        {formatMealAllergenWarning(meal)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#31302e]">
                  {mealStatus}
                </p>
              )}
            </div>
          </section>
          <section>
            <SectionTitle
              title="최근 공지"
              action={
                <Link href="/school/notices" className="text-sm font-medium text-[#0075de]">
                  전체 공지
                </Link>
              }
            />
            {notices.length ? (
              <div className="notion-card divide-y divide-[#e6e6e6]">
                {notices
                  .filter((notice) => isVisibleNotice(notice, today))
                  .slice(0, 5)
                  .map((notice) => (
                    <Link
                      href="/school/notices"
                      key={notice.id}
                      className="flex items-center justify-between gap-3 p-4 hover:bg-[#fbfbfa]"
                    >
                      <div>
                        <NoticeMeta notice={notice} />
                        <p className="mt-2 text-sm font-medium">{notice.title}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#a39e98]" />
                    </Link>
                  ))}
              </div>
            ) : (
              <EmptyState title="등록된 공지가 없습니다." />
            )}
          </section>
        </div>
      </div>
    </>
  );
}
