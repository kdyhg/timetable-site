"use client";

import recommendationData from "@/app/data/recommended-subjects.json";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui";
import {
  Download,
  FilterX,
  Scale,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type Recommendation = (typeof recommendationData.records)[number];

function DetailPanel({
  record,
  embedded = false,
}: {
  record: Recommendation;
  embedded?: boolean;
}) {
  return (
    <article
      className={
        embedded ? "overflow-hidden bg-white" : "notion-card overflow-hidden"
      }
    >
      <div className="border-b border-[#e6e6e6] p-4 sm:p-5">
        <div className="flex flex-wrap gap-2 text-xs text-[#787774]">
          <span className="rounded-full bg-[#f1f1ef] px-2 py-1">
            {record.area}
          </span>
          <span className="rounded-full bg-[#f1f1ef] px-2 py-1">
            {record.region}
          </span>
        </div>
        <h2 className="mt-4 break-words text-xl font-semibold">
          {record.university}
        </h2>
        {record.departmentGroup && (
          <p className="mt-2 text-sm text-[#787774]">
            {record.departmentGroup}
          </p>
        )}
        <p className="mt-1 break-words text-base font-medium">
          {record.department}
        </p>
      </div>
      <div className="space-y-6 p-4 sm:p-5">
        <section>
          <h3 className="text-xs font-semibold text-[#787774]">핵심과목</h3>
          <p className="mt-2 whitespace-pre-line break-words text-sm leading-7 text-[#31302e]">
            {record.coreSubjects || "별도로 제시된 핵심과목이 없습니다."}
          </p>
        </section>
        <section>
          <h3 className="text-xs font-semibold text-[#787774]">권장과목</h3>
          <p className="mt-2 whitespace-pre-line break-words text-sm leading-7 text-[#31302e]">
            {record.recommendedSubjects || "별도로 제시된 권장과목이 없습니다."}
          </p>
        </section>
        {record.note && (
          <section className="rounded-lg bg-[#f6f5f4] p-4">
            <h3 className="text-xs font-semibold text-[#787774]">비고</h3>
            <p className="mt-2 whitespace-pre-line break-words text-sm leading-7 text-[#31302e]">
              {record.note}
            </p>
          </section>
        )}
      </div>
    </article>
  );
}

function FilterControls({
  query,
  area,
  region,
  university,
  areas,
  regions,
  universities,
  setQuery,
  setArea,
  setRegion,
  setUniversity,
  reset,
}: {
  query: string;
  area: string;
  region: string;
  university: string;
  areas: string[];
  regions: string[];
  universities: string[];
  setQuery: (value: string) => void;
  setArea: (value: string) => void;
  setRegion: (value: string) => void;
  setUniversity: (value: string) => void;
  reset: () => void;
}) {
  return (
    <>
      <label className="relative block">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#a39e98]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="notion-input w-full pl-9"
          placeholder="대학·학과·과목 검색"
        />
      </label>
      <select
        value={area}
        onChange={(event) => {
          setArea(event.target.value);
          setRegion("all");
          setUniversity("all");
        }}
        className="notion-input"
      >
        <option value="all">권역 전체</option>
        {areas.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <select
        value={region}
        onChange={(event) => {
          setRegion(event.target.value);
          setUniversity("all");
        }}
        className="notion-input"
      >
        <option value="all">지역 전체</option>
        {regions.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <select
        value={university}
        onChange={(event) => setUniversity(event.target.value)}
        className="notion-input"
      >
        <option value="all">대학 전체</option>
        {universities.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <button type="button" onClick={reset} className="notion-button" title="필터 초기화">
        <FilterX className="h-4 w-4" /> 초기화
      </button>
    </>
  );
}

export default function RecommendedSubjectsPage() {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("all");
  const [region, setRegion] = useState("all");
  const [university, setUniversity] = useState("all");
  const [selectedId, setSelectedId] = useState(
    recommendationData.records[0]?.id ?? "",
  );
  const [mobileDetailId, setMobileDetailId] = useState("");
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(80);

  const areas = useMemo(
    () =>
      [...new Set(recommendationData.records.map((row) => row.area))].sort(
        (a, b) => a.localeCompare(b, "ko"),
      ),
    [],
  );
  const regions = useMemo(
    () =>
      [
        ...new Set(
          recommendationData.records
            .filter((row) => area === "all" || row.area === area)
            .map((row) => row.region),
        ),
      ].sort((a, b) => a.localeCompare(b, "ko")),
    [area],
  );
  const universities = useMemo(
    () =>
      [
        ...new Set(
          recommendationData.records
            .filter(
              (row) =>
                (area === "all" || row.area === area) &&
                (region === "all" || row.region === region),
            )
            .map((row) => row.university),
        ),
      ].sort((a, b) => a.localeCompare(b, "ko")),
    [area, region],
  );
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return recommendationData.records.filter((row) => {
      const text = [
        row.university,
        row.departmentGroup,
        row.department,
        row.coreSubjects,
        row.recommendedSubjects,
        row.note,
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!search || text.includes(search)) &&
        (area === "all" || row.area === area) &&
        (region === "all" || row.region === region) &&
        (university === "all" || row.university === university)
      );
    });
  }, [area, query, region, university]);
  const visible = filtered.slice(0, visibleCount);
  const selected =
    filtered.find((row) => row.id === selectedId) ?? filtered[0];
  const mobileDetail = recommendationData.records.find(
    (row) => row.id === mobileDetailId,
  );
  const comparisons = recommendationData.records.filter((row) =>
    comparisonIds.includes(row.id),
  );

  const reset = () => {
    setQuery("");
    setArea("all");
    setRegion("all");
    setUniversity("all");
    setVisibleCount(80);
  };

  const toggleComparison = (id: string) => {
    setComparisonIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 3
          ? [...current, id]
          : current,
    );
  };

  const filters = {
    query,
    area,
    region,
    university,
    areas,
    regions,
    universities,
    setQuery,
    setArea,
    setRegion,
    setUniversity,
    reset,
  };

  return (
    <>
      <PageHeader
        title="핵심·권장과목"
        description="권역별 대학과 모집단위가 제시한 핵심과목 및 권장과목을 검색하세요."
        crumbs={[
          { label: "홈", href: "/" },
          { label: "2028 진로진학", href: "/career/2028" },
          { label: "핵심·권장과목" },
        ]}
        actions={
          <a
            href={recommendationData.sourceFile}
            download={recommendationData.downloadName}
            className="notion-button"
          >
            <Download className="h-4 w-4" /> 원본 엑셀
          </a>
        }
      />

      <details className="notion-card mb-5 md:hidden">
        <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold">
          <SlidersHorizontal className="h-4 w-4 text-[#0075de]" /> 검색·필터
        </summary>
        <div className="grid gap-3 border-t border-[#e6e6e6] p-4">
          <FilterControls {...filters} />
        </div>
      </details>
      <div className="notion-card mb-5 hidden gap-3 p-4 md:grid md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <FilterControls {...filters} />
      </div>

      {comparisons.length > 0 && (
        <section className="notion-card mb-5 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[#e6e6e6] p-4">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-[#0075de]" />
              <h2 className="text-sm font-semibold">
                대학·학과 비교 {comparisons.length}/3
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setComparisonIds([])}
              className="min-h-11 shrink-0 text-xs font-medium text-[#787774] hover:text-[#191919]"
            >
              비교 초기화
            </button>
          </div>
          <div className="grid gap-3 p-3 md:hidden">
            {comparisons.map((row) => (
              <article key={row.id} className="rounded-lg border border-[#e6e6e6] p-4">
                <h3 className="font-semibold">{row.university}</h3>
                <p className="mt-1 text-sm">{row.department}</p>
                {[
                  ["지역", `${row.area} · ${row.region}`],
                  ["계열", row.departmentGroup || "-"],
                  ["핵심과목", row.coreSubjects || "-"],
                  ["권장과목", row.recommendedSubjects || "-"],
                  ["비고", row.note || "-"],
                ].map(([label, value]) => (
                  <div key={label} className="mt-4">
                    <p className="text-xs font-semibold text-[#787774]">{label}</p>
                    <p className="mt-1 whitespace-pre-line break-words text-sm leading-6">{value}</p>
                  </div>
                ))}
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[760px] w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#fbfbfa] text-left">
                  {["항목", ...comparisons.map((row) => `${row.university} ${row.department}`)].map((label) => (
                    <th key={label} className="border-b border-r border-[#e6e6e6] p-3 font-semibold last:border-r-0">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["지역", (row: Recommendation) => `${row.area} · ${row.region}`],
                  ["계열", (row: Recommendation) => row.departmentGroup || "-"],
                  ["핵심과목", (row: Recommendation) => row.coreSubjects || "-"],
                  ["권장과목", (row: Recommendation) => row.recommendedSubjects || "-"],
                  ["비고", (row: Recommendation) => row.note || "-"],
                ].map(([label, getter]) => (
                  <tr key={label as string}>
                    <th className="w-24 border-b border-r border-[#e6e6e6] bg-[#fbfbfa] p-3 text-left align-top text-xs font-semibold text-[#787774]">{label as string}</th>
                    {comparisons.map((row) => (
                      <td key={`${label}-${row.id}`} className="max-w-72 whitespace-pre-line border-b border-r border-[#e6e6e6] p-3 align-top leading-6 last:border-r-0">
                        {(getter as (row: Recommendation) => string)(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className="mb-3 text-sm text-[#787774]">
        검색 결과 {filtered.length.toLocaleString()}개 · 전체{" "}
        {recommendationData.sourceRowCount.toLocaleString()}개 모집단위
      </p>
      {filtered.length ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
          <div className="notion-card divide-y divide-[#e6e6e6] md:max-h-[75vh] md:overflow-y-auto">
            {visible.map((record) => {
              const active = selected?.id === record.id;
              const comparing = comparisonIds.includes(record.id);
              return (
                <div key={record.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(record.id);
                      setMobileDetailId(record.id);
                    }}
                    className={`w-full p-4 text-left hover:bg-[#fbfbfa] ${active ? "md:bg-[#f1f1ef]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold">{record.university}</p>
                        <p className="mt-1 break-words text-sm text-[#31302e]">{record.department}</p>
                        {record.departmentGroup && <p className="mt-1 text-xs text-[#a39e98]">{record.departmentGroup}</p>}
                      </div>
                      <span className="shrink-0 text-xs text-[#a39e98]">{record.region}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#787774]">
                      핵심과목 · {record.coreSubjects || "별도 제시 없음"}
                    </p>
                  </button>
                  <div className={`flex justify-end border-t border-[#e6e6e6] px-3 py-2 ${active ? "md:bg-[#f1f1ef]" : "bg-white"}`}>
                    <button
                      type="button"
                      onClick={() => toggleComparison(record.id)}
                      disabled={!comparing && comparisonIds.length >= 3}
                      className="notion-button px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {comparing ? <X className="h-3.5 w-3.5" /> : <Scale className="h-3.5 w-3.5" />}
                      {comparing ? "비교 제외" : "비교 담기"}
                    </button>
                  </div>
                  {active && (
                    <div className="hidden border-t border-[#e6e6e6] bg-white md:block lg:hidden">
                      <DetailPanel record={record} embedded />
                    </div>
                  )}
                </div>
              );
            })}
            {visibleCount < filtered.length && (
              <div className="p-3">
                <button type="button" onClick={() => setVisibleCount((count) => count + 80)} className="notion-button w-full">
                  결과 더 보기
                </button>
              </div>
            )}
          </div>
          <div className="hidden lg:block">
            {selected && <DetailPanel record={selected} />}
          </div>
        </div>
      ) : (
        <EmptyState
          title="검색 결과가 없습니다."
          description="검색어 또는 필터를 조정해 보세요."
        />
      )}

      {mobileDetail && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button type="button" aria-label="상세 닫기" onClick={() => setMobileDetailId("")} className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl">
            <div className="sticky top-0 z-10 flex justify-end border-b border-[#e6e6e6] bg-white px-3 py-2">
              <button type="button" onClick={() => setMobileDetailId("")} className="touch-icon-button" aria-label="상세 닫기">
                <X className="h-5 w-5" />
              </button>
            </div>
            <DetailPanel record={mobileDetail} embedded />
          </div>
        </div>
      )}
    </>
  );
}
