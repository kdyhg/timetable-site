"use client";

import recommendationData from "@/app/data/recommended-subjects.json";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui";
import {
  SUBJECT_OPTIONS,
  recordMatchesSubject,
  type CareerRecommendation,
} from "@/lib/career-exploration";
import { BookOpenCheck, ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const records = recommendationData.records as CareerRecommendation[];
const subjectGroups = ["국어·언어", "수학", "과학·정보", "사회"] as const;

export default function SubjectsToMajorsPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(["math"]);
  const [region, setRegion] = useState("all");
  const [visibleCount, setVisibleCount] = useState(36);

  const subjectCounts = useMemo(
    () =>
      new Map(
        SUBJECT_OPTIONS.map((option) => [
          option.id,
          records.filter((record) => recordMatchesSubject(record, option)).length,
        ]),
      ),
    [],
  );

  const selectedOptions = SUBJECT_OPTIONS.filter((option) =>
    selectedIds.includes(option.id),
  );

  const matches = (() => {
    if (!selectedIds.length) return [];
    const options = SUBJECT_OPTIONS.filter((option) =>
      selectedIds.includes(option.id),
    );
    return records
      .filter(
        (record) =>
          options.every((option) => recordMatchesSubject(record, option)) &&
          (region === "all" || record.region === region),
      )
      .sort(
        (a, b) =>
          a.university.localeCompare(b.university, "ko") ||
          a.department.localeCompare(b.department, "ko"),
      );
  })();

  const regions = (() => {
    if (!selectedIds.length) return [];
    const options = SUBJECT_OPTIONS.filter((option) =>
      selectedIds.includes(option.id),
    );
    return [
      ...new Set(
        records
          .filter((record) =>
            options.every((option) => recordMatchesSubject(record, option)),
          )
          .map((record) => record.region),
      ),
    ].sort((a, b) => a.localeCompare(b, "ko"));
  })();

  const toggleSubject = (id: string) => {
    setVisibleCount(36);
    setRegion("all");
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 3
          ? [...current, id]
          : current,
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="전공 탐색"
        title="과목에서 학과 찾기"
        description="좋아하거나 더 배우고 싶은 과목을 고르면, 대학이 그 과목을 핵심·권장과목으로 제시한 모집단위를 찾아줍니다."
        crumbs={[
          { label: "홈", href: "/" },
          { label: "2028 진로진학", href: "/career/2028" },
          { label: "과목에서 학과 찾기" },
        ]}
      />

      <section className="notion-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#e6e6e6] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="font-semibold">관심 과목을 최대 3개 선택하세요</h2>
            <p className="mt-1 text-sm text-[#787774]">
              여러 과목을 고르면 모두 함께 제시한 모집단위만 보여줍니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedIds([]);
              setRegion("all");
            }}
            className="notion-button shrink-0"
          >
            <RotateCcw className="h-4 w-4" /> 선택 초기화
          </button>
        </div>
        <div className="space-y-5 p-4 sm:p-5">
          {subjectGroups.map((group) => (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold text-[#787774]">{group}</p>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.filter((option) => option.group === group).map(
                  (option) => {
                    const selected = selectedIds.includes(option.id);
                    const disabled = !selected && selectedIds.length >= 3;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleSubject(option.id)}
                        disabled={disabled}
                        aria-pressed={selected}
                        className={`min-h-11 rounded-md border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                          selected
                            ? "border-[#0075de] bg-[#e8f3fc] text-[#005bab]"
                            : "border-[#e6e6e6] bg-white text-[#31302e] hover:bg-[#f6f5f4]"
                        }`}
                      >
                        {option.label}
                        <span className="ml-1.5 text-xs opacity-60">
                          {subjectCounts.get(option.id)?.toLocaleString()}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="my-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">
            {selectedOptions.length
              ? `${selectedOptions.map((item) => item.label).join(" + ")} 관련 모집단위`
              : "과목을 선택해 주세요"}
          </p>
          <p className="mt-1 text-sm text-[#787774]">
            {selectedOptions.length
              ? `${matches.length.toLocaleString()}개를 찾았습니다.`
              : "과목을 누르면 결과가 바로 나타납니다."}
          </p>
        </div>
        {selectedOptions.length > 0 && (
          <select
            value={region}
            onChange={(event) => {
              setRegion(event.target.value);
              setVisibleCount(36);
            }}
            className="notion-input min-w-36"
            aria-label="지역 필터"
          >
            <option value="all">지역 전체</option>
            {regions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        )}
      </div>

      {matches.length > 0 ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {matches.slice(0, visibleCount).map((record) => (
              <article key={record.id} className="notion-card flex min-h-60 flex-col p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#0075de]">
                      {record.region} · {record.area}
                    </p>
                    <h3 className="mt-2 break-words font-semibold">{record.university}</h3>
                    <p className="mt-1 break-words text-sm text-[#31302e]">
                      {record.department}
                    </p>
                  </div>
                  <BookOpenCheck className="h-4 w-4 shrink-0 text-[#a39e98]" />
                </div>
                <div className="mt-4 space-y-3 text-sm leading-6">
                  <div>
                    <p className="text-xs font-semibold text-[#787774]">핵심과목</p>
                    <p className="mt-1 line-clamp-2">{record.coreSubjects || "별도 제시 없음"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#787774]">권장과목</p>
                    <p className="mt-1 line-clamp-2">{record.recommendedSubjects || "별도 제시 없음"}</p>
                  </div>
                </div>
                <Link
                  href={`/career/2028/recommended-subjects?q=${encodeURIComponent(
                    `${record.university} ${record.department}`,
                  )}`}
                  className="mt-auto flex min-h-11 items-center justify-between border-t border-[#e6e6e6] pt-4 text-sm font-semibold text-[#005bab]"
                >
                  자세히 확인하기 <ChevronRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
          {visibleCount < matches.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + 36)}
              className="notion-button mt-5 w-full"
            >
              결과 더 보기
            </button>
          )}
        </>
      ) : selectedOptions.length ? (
        <EmptyState
          title="조건에 맞는 모집단위가 없습니다."
          description="선택한 과목 수를 줄이거나 지역을 전체로 바꿔 보세요."
        />
      ) : (
        <EmptyState
          title="첫 과목을 골라 보세요."
          description="이 화면에서의 선택은 저장되거나 전송되지 않습니다."
        />
      )}

      <p className="mt-6 border-t border-[#e6e6e6] pt-4 text-xs leading-5 text-[#787774]">
        결과는 대학이 공개한 핵심·권장과목 문구를 기준으로 찾습니다. 과목이 검색되지 않는다고 해서 해당 학과에 지원할 수 없다는 뜻은 아닙니다.
      </p>
    </>
  );
}
