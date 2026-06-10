"use client";

import { academicCalendarEvents } from "@/app/academic-calendar-data";
import { PageHeader } from "@/components/page-header";
import { StudyTimer } from "@/components/study-timer";
import { parseApiResponse } from "@/lib/client-api";
import { getDaysUntil } from "@/lib/student-tools";
import { Compass, Dices, ExternalLink, TimerReset } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const dDayPattern = /고사|학평|방학식|체육/;
const dDays = academicCalendarEvents
  .filter((event) => dDayPattern.test(event.title) && getDaysUntil(event.date) >= 0)
  .slice(0, 8);

type RecommendationRecord = {
  id: string;
  area: string;
  region: string;
  university: string;
  department: string;
  coreSubjects: string;
  recommendedSubjects: string;
};

export default function StudentToolsPage() {
  const [randomRecord, setRandomRecord] = useState<RecommendationRecord | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const pickRandom = async () => {
    setLoading(true);
    try {
      setRandomRecord(
        await parseApiResponse<RecommendationRecord>(
          fetch("/api/random-major", { cache: "no-store" }),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="학생 도구"
        description="공부 흐름을 잡고, 가까운 학교 일정과 새로운 학과를 가볍게 살펴보세요."
        crumbs={[{ label: "홈", href: "/" }, { label: "학교생활" }, { label: "학생 도구" }]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <TimerReset className="h-5 w-5 text-[#0075de]" />
            <h2 className="text-lg font-semibold">공부 타이머</h2>
          </div>
          <StudyTimer />
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Compass className="h-5 w-5 text-[#0075de]" />
            <h2 className="text-lg font-semibold">학교생활 D-Day</h2>
          </div>
          <div className="notion-card divide-y divide-[#e6e6e6]">
            {dDays.map((event) => {
              const days = getDaysUntil(event.date);
              return (
                <Link
                  href="/school/calendar"
                  key={event.id}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-[#fbfbfa]"
                >
                  <div>
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className="mt-1 text-xs text-[#787774]">{event.date}</p>
                  </div>
                  <strong className="shrink-0 text-sm text-[#0075de]">
                    {days === 0 ? "오늘" : `D-${days}`}
                  </strong>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Dices className="h-5 w-5 text-[#0075de]" />
            <h2 className="text-lg font-semibold">랜덤 학과 탐색</h2>
          </div>
          <div className="notion-card p-5 sm:p-6">
            {randomRecord ? (
              <div>
                <p className="text-xs font-semibold text-[#0075de]">
                  {randomRecord.region} · {randomRecord.area}
                </p>
                <h3 className="mt-2 text-xl font-bold">
                  {randomRecord.university} {randomRecord.department}
                </h3>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-md bg-[#f6f5f4] p-4">
                    <p className="text-xs font-semibold text-[#787774]">핵심과목</p>
                    <p className="mt-2 text-sm leading-6">
                      {randomRecord.coreSubjects || "별도 안내 없음"}
                    </p>
                  </div>
                  <div className="rounded-md bg-[#f6f5f4] p-4">
                    <p className="text-xs font-semibold text-[#787774]">권장과목</p>
                    <p className="mt-2 text-sm leading-6">
                      {randomRecord.recommendedSubjects || "별도 안내 없음"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-[#615d59]">
                버튼을 누르면 1,358개 모집단위 중 하나를 무작위로 보여줍니다.
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={pickRandom}
                disabled={loading}
                className="notion-button notion-button-primary"
              >
                <Dices className="h-4 w-4" /> {loading ? "뽑는 중..." : "다른 학과 뽑기"}
              </button>
              {randomRecord && (
                <Link
                  href={`/career/2028/recommended-subjects?q=${encodeURIComponent(
                    `${randomRecord.university} ${randomRecord.department}`,
                  )}`}
                  className="notion-button"
                >
                  <ExternalLink className="h-4 w-4" /> 자세히 보기
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
