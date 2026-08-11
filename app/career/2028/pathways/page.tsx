"use client";

import recommendationData from "@/app/data/recommended-subjects.json";
import { PageHeader } from "@/components/page-header";
import {
  PATHWAYS,
  getPathwayId,
  getTopSubjects,
  type CareerRecommendation,
} from "@/lib/career-exploration";
import {
  ArrowDown,
  ArrowRight,
  Blend,
  Cpu,
  FlaskConical,
  HeartPulse,
  Languages,
  Landmark,
  Leaf,
  Palette,
  Route,
  School,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const records = recommendationData.records as CareerRecommendation[];

const pathwayIcons = {
  "medicine-health": HeartPulse,
  education: School,
  "arts-sports": Palette,
  "life-environment": Leaf,
  "engineering-it": Cpu,
  "natural-science": FlaskConical,
  "business-social": Landmark,
  "humanities-language": Languages,
  "open-convergence": Blend,
};

export default function CareerPathwaysPage() {
  const [selectedId, setSelectedId] = useState("engineering-it");
  const summaries = useMemo(
    () =>
      PATHWAYS.map((pathway) => {
        const pathwayRecords = records.filter(
          (record) => getPathwayId(record) === pathway.id,
        );
        return {
          ...pathway,
          records: pathwayRecords,
          subjects: getTopSubjects(pathwayRecords),
          departments: [...new Set(pathwayRecords.map((record) => record.department))]
            .sort((a, b) => a.localeCompare(b, "ko"))
            .slice(0, 8),
          universities: [...new Set(pathwayRecords.map((record) => record.university))]
            .sort((a, b) => a.localeCompare(b, "ko"))
            .slice(0, 8),
        };
      }),
    [],
  );
  const selected = summaries.find((item) => item.id === selectedId) ?? summaries[0];
  const SelectedIcon = pathwayIcons[selected.id as keyof typeof pathwayIcons] ?? Route;

  return (
    <>
      <PageHeader
        eyebrow="한눈에 보는 전공 세계"
        title="진로 노선도"
        description="관심에서 출발해 자주 연결되는 과목과 대표 학과까지 한 노선으로 살펴보세요."
        crumbs={[
          { label: "홈", href: "/" },
          { label: "2028 진로진학", href: "/career/2028" },
          { label: "진로 노선도" },
        ]}
      />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="진로 계열 선택">
        {summaries.map((pathway) => {
          const Icon = pathwayIcons[pathway.id as keyof typeof pathwayIcons] ?? Route;
          const active = pathway.id === selected.id;
          return (
            <button
              key={pathway.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedId(pathway.id)}
              className={`flex min-h-12 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors ${
                active
                  ? "border-[#191919] bg-[#191919] text-white"
                  : "border-[#e6e6e6] bg-white text-[#615d59] hover:bg-[#f3f3f2]"
              }`}
            >
              <Icon className="h-4 w-4" /> {pathway.label}
            </button>
          );
        })}
      </div>

      <section
        className="mb-5 overflow-hidden rounded-lg border p-5 sm:p-7"
        style={{ borderColor: selected.color, backgroundColor: selected.softColor }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: selected.color }}
            >
              <SelectedIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold" style={{ color: selected.color }}>선택한 노선</p>
              <h2 className="mt-1 text-2xl font-bold">{selected.label}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4b4845]">{selected.description}</p>
            </div>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-2xl font-bold">{selected.records.length.toLocaleString()}</p>
            <p className="text-xs text-[#615d59]">관련 모집단위</p>
          </div>
        </div>
      </section>

      <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <section className="notion-card p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#191919] text-xs font-bold text-white">1</span>
            <h3 className="font-semibold">관심에서 출발</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#787774]">이런 주제가 자꾸 궁금하다면 이 노선을 둘러보세요.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.interests.map((interest) => (
              <span key={interest} className="rounded-md bg-[#f1f1ef] px-3 py-2 text-sm font-medium">{interest}</span>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-center text-[#a39e98]">
          <ArrowDown className="h-5 w-5 lg:hidden" />
          <ArrowRight className="hidden h-5 w-5 lg:block" />
        </div>

        <section className="notion-card p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: selected.color }}>2</span>
            <h3 className="font-semibold">과목으로 연결</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#787774]">관련 모집단위의 핵심·권장과목 문구에 자주 등장한 과목입니다.</p>
          <div className="mt-4 space-y-2">
            {selected.subjects.map((subject) => (
              <div key={subject.label} className="flex items-center justify-between gap-3 rounded-md bg-[#f6f5f4] px-3 py-2 text-sm">
                <span className="font-medium">{subject.label}</span>
                <span className="text-xs text-[#787774]">{subject.count}곳</span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-center text-[#a39e98]">
          <ArrowDown className="h-5 w-5 lg:hidden" />
          <ArrowRight className="hidden h-5 w-5 lg:block" />
        </div>

        <section className="notion-card p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: selected.color }}>3</span>
            <h3 className="font-semibold">학과에 도착</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#787774]">자료에 포함된 대표 모집단위 이름입니다.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.departments.map((department) => (
              <span key={department} className="rounded-md border border-[#e6e6e6] bg-white px-2.5 py-2 text-sm">{department}</span>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-5 border-y border-[#e6e6e6] py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">이 노선에서 만나는 대학</h3>
            <p className="mt-2 text-sm leading-6 text-[#787774]">{selected.universities.join(" · ")}</p>
          </div>
          <Link href="/career/2028/subjects-to-majors" className="notion-button shrink-0">
            과목으로 다시 탐색 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <p className="mt-5 text-xs leading-5 text-[#787774]">
        이 노선도는 진로검사 결과가 아니라 모집단위 이름과 소속 단과대학을 보기 쉽게 묶은 탐색 도구입니다. 대학마다 학과 이름과 교육과정이 다르므로 관심 학과의 실제 교육과정을 함께 확인하세요.
      </p>
    </>
  );
}
