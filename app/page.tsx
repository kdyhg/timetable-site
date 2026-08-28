"use client";

import { academicCalendarEvents } from "@/app/academic-calendar-data";
import { CurrentPeriodCard } from "@/components/current-period-card";
import { EveningStudyCard } from "@/components/evening-study-card";
import { ExamFocusCard } from "@/components/exam-focus-card";
import {
  NoticeImageIndicator,
  NoticeMeta,
  stripNoticePhotoMarkers,
} from "@/components/content-ui";
import { EmptyState, SectionTitle } from "@/components/ui";
import { parseApiResponse } from "@/lib/client-api";
import {
  isVisibleNotice,
  type Notice,
} from "@/lib/content";
import {
  defaultEveningStudyData,
  getEveningStudyGroups,
  getEveningStudyOffReason,
  getEveningStudyWeekday,
  type EveningStudyData,
} from "@/lib/evening-study";
import {
  fetchMeals,
  formatMealAllergenWarning,
  formatAcademicDate,
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
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function HomePage() {
  const today = getLocalDateString();
  const now = useMemo(() => new Date(), []);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealStatus, setMealStatus] = useState("급식 정보를 불러오는 중입니다.");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [eveningStudy, setEveningStudy] = useState<EveningStudyData>(
    defaultEveningStudyData,
  );
  const todayDate = useMemo(() => parseLocalDate(today), [today]);
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
  const eveningWeekday = getEveningStudyWeekday(now);
  const eveningGroups = eveningWeekday
    ? getEveningStudyGroups(eveningStudy, eveningWeekday)
    : getEveningStudyGroups(eveningStudy, "monday").map((group) => ({
        ...group,
        students: [],
      }));

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
    parseApiResponse<Notice[]>(fetch("/api/notices", { cache: "no-store" }))
      .then(setNotices)
      .catch(() => setNotices([]));
    parseApiResponse<EveningStudyData>(
      fetch("/api/evening-study", { cache: "no-store" }),
    )
      .then(setEveningStudy)
      .catch(() => setEveningStudy(defaultEveningStudyData));
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

      {examFocus && <ExamFocusCard focus={examFocus} />}

      <div className="mb-8">
        <CurrentPeriodCard />
      </div>

      <section className="mb-8">
        <SectionTitle
          title="오늘의 야간자율학습"
          action={
            <Link
              href="/school/evening-study"
              className="text-sm font-medium text-[#0075de]"
            >
              요일별 명단
            </Link>
          }
        />
        <EveningStudyCard
          groups={eveningGroups}
          effectiveDate={eveningStudy.settings.effectiveDate}
          offReason={getEveningStudyOffReason(now, academicCalendarEvents)}
        />
      </section>

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
                <p className="mt-2 flex min-w-0 flex-wrap items-center gap-2 font-semibold">
                  <span>{notice.title}</span>
                  <NoticeImageIndicator notice={notice} />
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#615d59]">
                  {stripNoticePhotoMarkers(notice.content)}
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
            {academicToday.length ? (
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
              </div>
            ) : (
              <EmptyState title="오늘 등록된 일정이 없습니다." />
            )}
          </section>

          <section>
            <SectionTitle
              title="앞으로 7일"
              action={
                <Link href="/school/calendar" className="text-sm font-medium text-[#0075de]">
                  전체 일정
                </Link>
              }
            />
            {academicUpcoming.length ? (
              <div className="notion-card divide-y divide-[#e6e6e6]">
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
                      <div className="min-w-0">
                        <NoticeMeta notice={notice} />
                        <p className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-sm font-medium">
                          <span>{notice.title}</span>
                          <NoticeImageIndicator notice={notice} />
                        </p>
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
