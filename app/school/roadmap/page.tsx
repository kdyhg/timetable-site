"use client";

import { academicCalendarEvents } from "@/app/academic-calendar-data";
import { CategoryBadge } from "@/components/content-ui";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui";
import { parseApiResponse } from "@/lib/client-api";
import type { ClassItem, RoadmapItem } from "@/lib/content";
import { formatDateString, getLocalDateString } from "@/lib/school";
import { Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const currentMonth = getLocalDateString().slice(0, 7);

export default function RoadmapPage() {
  const [month, setMonth] = useState(currentMonth);
  const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([]);
  const [items, setItems] = useState<ClassItem[]>([]);

  useEffect(() => {
    Promise.allSettled([
      parseApiResponse<RoadmapItem[]>(fetch("/api/roadmap-items", { cache: "no-store" })),
      parseApiResponse<ClassItem[]>(fetch("/api/class-items", { cache: "no-store" })),
    ]).then(([roadmapResult, itemResult]) => {
      if (roadmapResult.status === "fulfilled") setRoadmaps(roadmapResult.value);
      if (itemResult.status === "fulfilled") setItems(itemResult.value);
    });
  }, []);

  const months = useMemo(
    () =>
      Array.from(
        new Set([
          currentMonth,
          ...academicCalendarEvents.map((event) => event.date.slice(0, 7)),
          ...roadmaps.map((item) => item.month),
          ...items.map((item) => item.date.slice(0, 7)),
        ]),
      ).sort(),
    [items, roadmaps],
  );
  const monthRoadmaps = roadmaps.filter((item) => item.month === month);
  const monthAcademic = academicCalendarEvents.filter((event) =>
    event.date.startsWith(month),
  );
  const monthItems = items.filter((item) => item.date.startsWith(month));

  return (
    <>
      <PageHeader
        title="고2 월별 로드맵"
        description="이번 달에 해야 할 일과 학교 일정을 한 흐름으로 확인하세요."
        crumbs={[{ label: "홈", href: "/" }, { label: "학교생활" }, { label: "월별 로드맵" }]}
      />
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {months.map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => setMonth(value)}
            className={`min-h-11 shrink-0 rounded-md px-4 text-sm font-semibold ${
              month === value
                ? "bg-[#191919] text-white"
                : "border border-[#e6e6e6] bg-white text-[#615d59]"
            }`}
          >
            {Number(value.slice(5))}월
          </button>
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <section>
          <h2 className="mb-3 text-lg font-semibold">이번 달 행동 가이드</h2>
          {monthRoadmaps.length ? (
            <div className="space-y-4">
              {monthRoadmaps.map((item) => (
                <article key={item.id} className="notion-card p-5">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#615d59]">
                    {item.description}
                  </p>
                  {item.action_points.length > 0 && (
                    <ul className="mt-4 space-y-2 border-t border-[#e6e6e6] pt-4">
                      {item.action_points.map((point) => (
                        <li key={point} className="flex gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0075de]" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.link_url && (
                    <a
                      href={item.link_url}
                      target="_blank"
                      rel="noreferrer"
                      className="notion-button mt-4"
                    >
                      <ExternalLink className="h-4 w-4" /> 관련 자료
                    </a>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="이 달에 등록된 행동 가이드가 없습니다." />
          )}
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold">학교 일정과 평가</h2>
          {monthAcademic.length || monthItems.length ? (
            <div className="notion-card divide-y divide-[#e6e6e6]">
              {monthItems.map((item) => (
                <Link
                  href="/school/assessments"
                  key={`item-${item.id}`}
                  className="block p-4 hover:bg-[#fbfbfa]"
                >
                  <CategoryBadge label={item.item_type} />
                  <p className="mt-2 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-[#0075de]">
                    {formatDateString(item.date, item.end_date)}
                  </p>
                </Link>
              ))}
              {monthAcademic.map((event) => (
                <Link
                  href="/school/calendar"
                  key={`academic-${event.id}`}
                  className="block p-4 hover:bg-[#fbfbfa]"
                >
                  <CategoryBadge label="학사일정" />
                  <p className="mt-2 text-sm font-semibold">{event.title}</p>
                  <p className="mt-1 text-xs text-[#0075de]">
                    {formatDateString(event.date, event.endDate)}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="이 달에 등록된 일정이 없습니다." />
          )}
        </section>
      </div>
    </>
  );
}
