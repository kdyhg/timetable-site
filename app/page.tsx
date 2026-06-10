"use client";

import { academicCalendarEvents } from "@/app/academic-calendar-data";
import { PageHeader } from "@/components/page-header";
import { EmptyState, SectionTitle } from "@/components/ui";
import { fetchMeals, formatAcademicDate, getLocalDateString, upcomingEvents } from "@/lib/school";
import type { Notice } from "@/lib/notices";
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Newspaper,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const shortcuts = [
  { href: "/school/timetable", label: "시간표", description: "학생별 시간표 조회", icon: ClipboardList },
  { href: "/school/meals", label: "급식", description: "날짜별 급식 조회", icon: Utensils },
  { href: "/school/calendar", label: "학사일정", description: "학기별 학교 일정", icon: CalendarDays },
  { href: "/school/notices", label: "공지사항", description: "학급 공지 확인", icon: Newspaper },
  { href: "/career/2028", label: "2028 진로진학", description: "대입 자료 모음", icon: GraduationCap },
];

export default function HomePage() {
  const [meal, setMeal] = useState("급식 정보를 불러오는 중입니다.");
  const [notices, setNotices] = useState<Notice[]>([]);
  const events = useMemo(() => upcomingEvents(academicCalendarEvents), []);

  useEffect(() => {
    fetchMeals(getLocalDateString())
      .then((rows) => setMeal(rows.map((row) => row.menu).join(" · ") || "오늘은 급식 정보가 없습니다."))
      .catch(() => setMeal("급식 정보를 불러오지 못했습니다."));
    fetch("/api/notices", { cache: "no-store" })
      .then((response) => response.json())
      .then((body) => setNotices(body.notices?.slice(0, 4) ?? []))
      .catch(() => setNotices([]));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="2026학년도"
        title="해강고 2학년 10반"
        description="학교생활과 진로진학 자료를 한곳에서 확인하세요."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="notion-card group p-4 hover:bg-[#fbfbfa]">
              <Icon className="h-5 w-5 text-[#0075de]" />
              <h2 className="mt-5 text-sm font-semibold">{item.label}</h2>
              <p className="mt-1 text-xs leading-5 text-[#787774]">{item.description}</p>
              <ChevronRight className="mt-4 h-4 w-4 text-[#a39e98] transition-transform group-hover:translate-x-1" />
            </Link>
          );
        })}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <section>
          <SectionTitle title="다가오는 7일" action={<Link href="/school/calendar" className="text-sm font-medium text-[#0075de]">전체 일정</Link>} />
          {events.length ? (
            <div className="notion-card divide-y divide-[#e6e6e6]">
              {events.map((event) => (
                <Link href="/school/calendar" key={event.id} className="flex gap-4 p-4 hover:bg-[#fbfbfa]">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#0075de]" />
                  <div>
                    <p className="text-xs font-medium text-[#787774]">{formatAcademicDate(event)}</p>
                    <p className="mt-1 text-sm font-medium">{event.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : <EmptyState title="다가오는 일정이 없습니다." />}
        </section>

        <div className="space-y-8">
          <section>
            <SectionTitle title="오늘의 급식" action={<Link href="/school/meals" className="text-sm font-medium text-[#0075de]">급식 보기</Link>} />
            <div className="notion-card p-5 text-sm leading-7 text-[#31302e]">{meal}</div>
          </section>
          <section>
            <SectionTitle title="최근 공지" action={<Link href="/school/notices" className="text-sm font-medium text-[#0075de]">전체 공지</Link>} />
            {notices.length ? (
              <div className="notion-card divide-y divide-[#e6e6e6]">
                {notices.map((notice) => (
                  <Link href="/school/notices" key={notice.id} className="block p-4 hover:bg-[#fbfbfa]">
                    <p className="text-sm font-medium">{notice.is_important ? "중요 · " : ""}{notice.title}</p>
                    <p className="mt-1 text-xs text-[#a39e98]">{new Date(notice.created_at).toLocaleDateString("ko-KR")}</p>
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
