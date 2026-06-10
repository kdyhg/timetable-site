"use client";

import { academicCalendarEvents } from "@/app/academic-calendar-data";
import { CategoryBadge, ResourceLinks } from "@/components/content-ui";
import { PageHeader } from "@/components/page-header";
import { EmptyState, SectionTitle } from "@/components/ui";
import { parseApiResponse } from "@/lib/client-api";
import { isVisibleNotice, type ClassItem, type Notice, type RoadmapItem } from "@/lib/content";
import { endOfWeek, formatAcademicDate, formatDateString, getLocalDateString, isDateInRange, startOfWeek } from "@/lib/school";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function WeeklyPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [items, setItems] = useState<ClassItem[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const start = startOfWeek();
  const end = endOfWeek();
  const today = getLocalDateString();
  const academic = academicCalendarEvents.filter((event) => isDateInRange(event.date, start, end, event.endDate));
  const weeklyItems = items.filter((item) => isDateInRange(item.date, start, end, item.end_date));
  const weeklyNotices = notices.filter((notice) => isVisibleNotice(notice, today) && (notice.is_important || (notice.due_date && isDateInRange(notice.due_date, start, end))));
  const monthRoadmaps = roadmaps.filter((item) => item.month === today.slice(0, 7));

  useEffect(() => {
    Promise.allSettled([
      parseApiResponse<Notice[]>(fetch("/api/notices", { cache: "no-store" })),
      parseApiResponse<ClassItem[]>(fetch("/api/class-items", { cache: "no-store" })),
      parseApiResponse<RoadmapItem[]>(fetch("/api/roadmap-items", { cache: "no-store" })),
    ]).then(([noticeResult, itemResult, roadmapResult]) => {
      if (noticeResult.status === "fulfilled") setNotices(noticeResult.value);
      if (itemResult.status === "fulfilled") setItems(itemResult.value);
      if (roadmapResult.status === "fulfilled") setRoadmaps(roadmapResult.value);
    });
  }, []);

  return (
    <>
      <PageHeader
        eyebrow={`${formatDateString(getLocalDateString(start))} ~ ${formatDateString(getLocalDateString(end))}`}
        title="이번 주에 꼭 확인할 것"
        description="이번 주의 학사일정, 평가·제출, 중요 공지와 이번 달 행동 가이드를 자동으로 모았습니다."
        crumbs={[{ label: "홈", href: "/" }, { label: "학교생활" }, { label: "주간 브리핑" }]}
      />
      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        <section><SectionTitle title="학사일정" />{academic.length ? <div className="notion-card divide-y divide-[#e6e6e6]">{academic.map((event) => <Link href="/school/calendar" key={event.id} className="block p-4 hover:bg-[#fbfbfa]"><p className="text-xs text-[#0075de]">{formatAcademicDate(event)}</p><p className="mt-1 text-sm font-medium">{event.title}</p></Link>)}</div> : <EmptyState title="이번 주 학사일정이 없습니다." />}</section>
        <section><SectionTitle title="평가·제출·준비물" />{weeklyItems.length ? <div className="notion-card divide-y divide-[#e6e6e6]">{weeklyItems.map((item) => <Link href="/school/assessments" key={item.id} className="block p-4 hover:bg-[#fbfbfa]"><CategoryBadge label={item.item_type} /><p className="mt-2 text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-[#0075de]">{formatDateString(item.date)}{item.subject ? ` · ${item.subject}` : ""}</p></Link>)}</div> : <EmptyState title="이번 주 평가·제출 일정이 없습니다." />}</section>
        <section><SectionTitle title="중요 공지와 마감" />{weeklyNotices.length ? <div className="notion-card divide-y divide-[#e6e6e6]">{weeklyNotices.map((notice) => <article key={notice.id} className="p-4"><CategoryBadge label={notice.category} /><h3 className="mt-2 text-sm font-semibold">{notice.title}</h3>{notice.due_date && <p className="mt-1 text-xs text-[#0075de]">마감 {formatDateString(notice.due_date)}</p>}<ResourceLinks linkUrl={notice.link_url} attachmentUrl={notice.attachment_url} attachmentName={notice.attachment_name} /></article>)}</div> : <EmptyState title="이번 주 중요 공지나 마감이 없습니다." />}</section>
        <section><SectionTitle title="이번 달 행동 가이드" />{monthRoadmaps.length ? <div className="notion-card divide-y divide-[#e6e6e6]">{monthRoadmaps.slice(0, 4).map((roadmap) => <Link href="/school/roadmap" key={roadmap.id} className="block p-4 hover:bg-[#fbfbfa]"><CategoryBadge label={`${Number(roadmap.month.slice(5))}월`} /><p className="mt-2 text-sm font-semibold">{roadmap.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#787774]">{roadmap.description}</p></Link>)}</div> : <EmptyState title="이번 달에 등록된 행동 가이드가 없습니다." />}</section>
      </div>
    </>
  );
}
