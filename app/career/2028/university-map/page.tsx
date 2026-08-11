"use client";

import recommendationData from "@/app/data/recommended-subjects.json";
import { PageHeader } from "@/components/page-header";
import type { CareerRecommendation } from "@/lib/career-exploration";
import { Building2, ChevronRight, MapPin, MapPinned } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const records = recommendationData.records as CareerRecommendation[];

const regionPositions: Record<string, { x: number; y: number }> = {
  서울: { x: 31, y: 20 },
  인천: { x: 18, y: 25 },
  경기: { x: 40, y: 29 },
  강원: { x: 68, y: 18 },
  충북: { x: 55, y: 39 },
  충남: { x: 29, y: 45 },
  대전: { x: 43, y: 51 },
  경북: { x: 72, y: 50 },
  대구: { x: 66, y: 59 },
  전북: { x: 38, y: 62 },
  경남: { x: 57, y: 74 },
  부산: { x: 75, y: 78 },
  광주: { x: 29, y: 76 },
  전남: { x: 31, y: 87 },
};

const areaColors: Record<string, { marker: string; soft: string }> = {
  수도권: { marker: "#0075de", soft: "#e8f3fc" },
  중부권: { marker: "#b97800", soft: "#fff4dc" },
  영남권: { marker: "#27845b", soft: "#eaf8f1" },
  호남권: { marker: "#c85a3c", soft: "#fff0eb" },
};

export default function UniversityMapPage() {
  const regions = useMemo(
    () =>
      [...new Set(records.map((record) => record.region))]
        .map((region) => {
          const regionRecords = records.filter((record) => record.region === region);
          return {
            region,
            area: regionRecords[0]?.area ?? "",
            universities: [...new Set(regionRecords.map((record) => record.university))].sort(
              (a, b) => a.localeCompare(b, "ko"),
            ),
            departments: regionRecords.length,
          };
        })
        .sort((a, b) => a.region.localeCompare(b.region, "ko")),
    [],
  );
  const [selectedRegion, setSelectedRegion] = useState(
    regions.some((item) => item.region === "부산") ? "부산" : regions[0]?.region ?? "",
  );
  const selected = regions.find((item) => item.region === selectedRegion) ?? regions[0];

  return (
    <>
      <PageHeader
        eyebrow="지역 탐색"
        title="대학 지도"
        description="2028 핵심·권장과목 자료에 포함된 47개 대학을 지역별로 둘러보세요."
        crumbs={[
          { label: "홈", href: "/" },
          { label: "2028 진로진학", href: "/career/2028" },
          { label: "대학 지도" },
        ]}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(420px,.9fr)_minmax(0,1.1fr)]">
        <section className="notion-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e6e6e6] px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-[#0075de]" />
              <h2 className="text-sm font-semibold">권역별 분포</h2>
            </div>
            <span className="text-xs text-[#787774]">지역을 눌러 확인</span>
          </div>
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[480px] overflow-hidden bg-[#fafaf8]">
            <svg
              viewBox="0 0 390 520"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <path
                d="M144 35 C193 21 268 52 291 104 C311 149 286 181 307 225 C326 264 313 305 329 346 C342 380 318 411 279 421 C245 430 231 471 181 485 C142 496 97 465 86 430 C74 392 99 361 78 326 C54 286 65 247 88 216 C111 185 90 154 101 113 C111 76 119 48 144 35 Z"
                fill="#f0efec"
                stroke="#d9d7d2"
                strokeWidth="2"
              />
              <path d="M125 187 C174 205 227 188 283 201" fill="none" stroke="#dedcd7" strokeDasharray="4 6" />
              <path d="M99 312 C164 291 230 315 319 298" fill="none" stroke="#dedcd7" strokeDasharray="4 6" />
              <text x="18" y="175" fill="#b7b3ad" fontSize="12">서해</text>
              <text x="340" y="220" fill="#b7b3ad" fontSize="12">동해</text>
              <text x="174" y="510" fill="#b7b3ad" fontSize="12">남해</text>
            </svg>

            {regions.map((item) => {
              const position = regionPositions[item.region];
              if (!position) return null;
              const selectedMarker = item.region === selected?.region;
              const color = areaColors[item.area]?.marker ?? "#5d6875";
              return (
                <button
                  key={item.region}
                  type="button"
                  onClick={() => setSelectedRegion(item.region)}
                  aria-pressed={selectedMarker}
                  aria-label={`${item.region}, 대학 ${item.universities.length}곳`}
                  className="absolute flex min-h-14 w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-md text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0075de]"
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold text-white shadow-sm transition-transform ${selectedMarker ? "scale-110" : "hover:scale-105"}`}
                    style={{
                      backgroundColor: color,
                      borderColor: selectedMarker ? "#191919" : "white",
                    }}
                  >
                    {item.universities.length}
                  </span>
                  <span className="mt-0.5 rounded bg-white/85 px-1 text-[11px] font-semibold text-[#31302e]">
                    {item.region}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[#e6e6e6] px-4 py-3 sm:px-5">
            {Object.entries(areaColors).map(([area, colors]) => (
              <span key={area} className="flex items-center gap-1.5 text-xs text-[#615d59]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.marker }} />
                {area}
              </span>
            ))}
          </div>
        </section>

        {selected && (
          <section className="notion-card overflow-hidden">
            <div className="border-b border-[#e6e6e6] p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: areaColors[selected.area]?.marker }}>
                <MapPin className="h-4 w-4" /> {selected.area}
              </div>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">{selected.region}</h2>
                  <p className="mt-1 text-sm text-[#787774]">
                    대학 {selected.universities.length}곳 · 모집단위 {selected.departments.toLocaleString()}개
                  </p>
                </div>
                <span
                  className="rounded-md px-3 py-2 text-xs font-semibold"
                  style={{ backgroundColor: areaColors[selected.area]?.soft }}
                >
                  자료에 포함된 대학
                </span>
              </div>
            </div>
            <div className="divide-y divide-[#e6e6e6]">
              {selected.universities.map((university) => {
                const count = records.filter(
                  (record) => record.region === selected.region && record.university === university,
                ).length;
                return (
                  <Link
                    key={university}
                    href={`/career/2028/recommended-subjects?q=${encodeURIComponent(university)}`}
                    className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-[#fbfbfa] sm:px-5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#f1f1ef] text-[#615d59]">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{university}</span>
                      <span className="mt-0.5 block text-xs text-[#787774]">모집단위 {count}개</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#a39e98]" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <p className="mt-5 text-xs leading-5 text-[#787774]">
        지도 표시는 대학의 정확한 캠퍼스 좌표가 아니라 자료에 적힌 지역을 기준으로 한 개략 위치입니다. 대학별 캠퍼스가 여러 곳인 경우 실제 모집단위 소재지는 대학 안내를 함께 확인하세요.
      </p>
    </>
  );
}
