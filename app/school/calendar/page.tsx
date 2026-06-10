"use client";

import { academicCalendarEvents, type AcademicSemester } from "@/app/academic-calendar-data";
import { PageHeader } from "@/components/page-header";
import { formatAcademicDate, parseLocalDate, upcomingEvents } from "@/lib/school";
import { CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";

type Filter = "all" | AcademicSemester;

export default function CalendarPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const upcoming = useMemo(() => upcomingEvents(academicCalendarEvents), []);
  const groups = useMemo(() => {
    const filtered = academicCalendarEvents.filter((event) => filter === "all" || event.semester === filter);
    return (["1학기", "2학기"] as AcademicSemester[]).map((semester) => ({
      semester,
      months: Array.from(
        filtered
          .filter((event) => event.semester === semester)
          .reduce((map, event) => {
            const month = `${parseLocalDate(event.date).getMonth() + 1}월`;
            map.set(month, [...(map.get(month) ?? []), event]);
            return map;
          }, new Map<string, typeof academicCalendarEvents>()),
      ),
    })).filter((group) => group.months.length);
  }, [filter]);

  return (
    <>
      <PageHeader
        title="학사일정"
        description="2026학년도 학사일정을 학기와 월별로 확인하세요."
        crumbs={[{ label: "홈", href: "/" }, { label: "학교생활" }, { label: "학사일정" }]}
        actions={
          <div className="flex rounded-lg border border-[#e6e6e6] bg-white p-1">
            {(["all", "1학기", "2학기"] as Filter[]).map((item) => (
              <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${filter === item ? "bg-[#e9e9e7]" : "text-[#787774] hover:bg-[#f3f3f2]"}`}>
                {item === "all" ? "전체" : item}
              </button>
            ))}
          </div>
        }
      />
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">다가오는 7일</h2>
          <div className="notion-card grid divide-y divide-[#e6e6e6] md:grid-cols-2 md:divide-x md:divide-y-0">
            {upcoming.map((event) => (
              <div key={event.id} className="flex gap-3 p-4">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#0075de]" />
                <div><p className="text-xs text-[#787774]">{formatAcademicDate(event)}</p><p className="mt-1 text-sm font-medium">{event.title}</p></div>
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
  );
}
