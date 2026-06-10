"use client";

import { academicCalendarEvents } from "@/app/academic-calendar-data";
import { getSchoolTimeState } from "@/lib/student-tools";
import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

export function CurrentPeriodCard() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    const timeout = window.setTimeout(() => {
      update();
    }, 0);
    const interval = window.setInterval(update, 15_000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  if (!now) {
    return <div className="notion-card min-h-44 animate-pulse bg-white" />;
  }

  const state = getSchoolTimeState(now, academicCalendarEvents);
  const headline =
    state.subject ||
    state.nextSubject ||
    (state.status === "after" ? "오늘 수업 종료" : "오늘 수업이 없습니다.");

  return (
    <section className="notion-card overflow-hidden">
      <div className="border-b border-[#e6e6e6] px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clock3 className="h-4 w-4 text-[#0075de]" /> 지금 학교는
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm font-semibold text-[#0075de]">{state.label}</p>
        <h2 className="mt-2 text-2xl font-bold">{headline}</h2>
        {state.remainingMinutes !== null && (
          <p className="mt-2 text-sm text-[#615d59]">
            {state.status === "class" ? "수업 종료까지" : "다음 수업까지"}{" "}
            <b>{state.remainingMinutes}분</b>
          </p>
        )}
        {state.status === "class" && state.nextPeriod && (
          <p className="mt-4 border-t border-[#e6e6e6] pt-4 text-sm text-[#615d59]">
            다음 {state.nextPeriod}교시 · {state.nextSubject}
          </p>
        )}
      </div>
    </section>
  );
}
