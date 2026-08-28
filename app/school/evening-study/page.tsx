"use client";

import { academicCalendarEvents } from "@/app/academic-calendar-data";
import { EveningStudyCard } from "@/components/evening-study-card";
import { PageHeader } from "@/components/page-header";
import { parseApiResponse } from "@/lib/client-api";
import {
  defaultEveningStudyData,
  eveningStudyWeekdays,
  getEveningStudyGroups,
  getEveningStudyOffReason,
  getEveningStudyWeekday,
  type EveningStudyData,
  type EveningStudyWeekday,
} from "@/lib/evening-study";
import { ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function EveningStudyPage() {
  const now = useMemo(() => new Date(), []);
  const todayWeekday = getEveningStudyWeekday(now);
  const [data, setData] = useState<EveningStudyData>(defaultEveningStudyData);
  const [selectedWeekday, setSelectedWeekday] = useState<EveningStudyWeekday>(
    todayWeekday ?? "monday",
  );

  useEffect(() => {
    parseApiResponse<EveningStudyData>(
      fetch("/api/evening-study", { cache: "no-store" }),
    )
      .then(setData)
      .catch(() => setData(defaultEveningStudyData));
  }, []);

  const todayGroups = todayWeekday
    ? getEveningStudyGroups(data, todayWeekday)
    : getEveningStudyGroups(data, "monday").map((group) => ({
        ...group,
        students: [],
      }));
  const selectedGroups = getEveningStudyGroups(data, selectedWeekday);
  const todayLabel = now.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <>
      <PageHeader
        eyebrow="학교생활"
        title="야간자율학습"
        description="오늘 참석 예정자와 요일별 기본 명단을 종료 차시별로 확인합니다."
        crumbs={[
          { label: "홈", href: "/" },
          { label: "학교생활" },
          { label: "야간자율학습" },
        ]}
      />

      <section className="mb-8">
        <div className="mb-3">
          <p className="text-sm font-semibold text-[#0075de]">{todayLabel}</p>
          <h2 className="mt-1 text-lg font-semibold">오늘의 야간자율학습</h2>
        </div>
        <EveningStudyCard
          groups={todayGroups}
          effectiveDate={data.settings.effectiveDate}
          offReason={getEveningStudyOffReason(now, academicCalendarEvents)}
        />
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">요일별 기본 명단</h2>
          <p className="mt-1 text-sm text-[#787774]">
            행사나 개인 사정으로 실제 참석 여부는 달라질 수 있습니다.
          </p>
        </div>
        <div className="mb-3 flex gap-1 overflow-x-auto rounded-lg border border-[#e6e6e6] bg-white p-1">
          {eveningStudyWeekdays.map((weekday) => (
            <button
              key={weekday.key}
              type="button"
              onClick={() => setSelectedWeekday(weekday.key)}
              className={`min-h-11 min-w-[62px] flex-1 whitespace-nowrap rounded-md px-2 text-sm font-semibold transition-colors ${
                selectedWeekday === weekday.key
                  ? "bg-[#0075de] text-white"
                  : "text-[#615d59] hover:bg-[#f3f3f2]"
              }`}
            >
              {weekday.label}요일
            </button>
          ))}
        </div>
        <EveningStudyCard
          groups={selectedGroups}
          effectiveDate={data.settings.effectiveDate}
          emptyMessage="이 요일에는 참석 예정자가 없습니다."
        />
      </section>

      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#787774]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        학생 개인정보 보호를 위해 번호와 이름 일부만 표시합니다.
      </p>
    </>
  );
}
