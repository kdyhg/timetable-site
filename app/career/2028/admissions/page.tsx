"use client";

import { admissionDocuments, admissionRegionFilters, type AdmissionDocument, type AdmissionRegionFilter } from "@/app/admissions-data";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui";
import { Download, ExternalLink, FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";

export default function AdmissionsPage() {
  const [region, setRegion] = useState<AdmissionRegionFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdmissionDocument>(admissionDocuments[0]);
  const filtered = useMemo(() => admissionDocuments.filter((document) => (region === "all" || document.region === region) && (!query.trim() || document.university.toLowerCase().includes(query.trim().toLowerCase()))), [query, region]);
  const active = filtered.find((document) => document.id === selected.id) ?? filtered[0];

  return (
    <>
      <PageHeader title="대학별 대입전형" description="서울·부산 대학의 2028학년도 대입전형 시행계획을 확인하세요." crumbs={[{ label: "홈", href: "/" }, { label: "2028 진로진학", href: "/career/2028" }, { label: "대학별 대입전형" }]} />
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          <label className="relative block"><Search className="absolute left-3 top-3 h-4 w-4 text-[#a39e98]" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="notion-input w-full pl-9" placeholder="대학명 검색" /></label>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-[#e6e6e6] bg-white p-1">
            {admissionRegionFilters.map((filter) => <button key={filter.id} type="button" onClick={() => setRegion(filter.id)} className={`rounded-md px-2 py-2 text-xs font-medium ${region === filter.id ? "bg-[#e9e9e7]" : "text-[#787774] hover:bg-[#f3f3f2]"}`}>{filter.label}</button>)}
          </div>
          <div className="notion-card max-h-[68vh] overflow-y-auto divide-y divide-[#e6e6e6]">
            {filtered.map((document) => <button key={document.id} type="button" onClick={() => setSelected(document)} className={`flex w-full items-start gap-2 p-3 text-left hover:bg-[#fbfbfa] ${active?.id === document.id ? "bg-[#f1f1ef]" : ""}`}><FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#787774]" /><span><span className="block text-sm font-medium">{document.university}</span><span className="mt-0.5 block text-xs text-[#a39e98]">{document.regionLabel}</span></span></button>)}
          </div>
        </aside>
        {active ? (
          <section className="notion-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#e6e6e6] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs text-[#787774]">{active.regionLabel}</p><h2 className="mt-1 text-xl font-semibold">{active.university}</h2></div>
              <div className="flex gap-2"><a href={active.file} target="_blank" rel="noreferrer" className="notion-button"><ExternalLink className="h-4 w-4" /> 새 창</a><a href={active.file} download={active.downloadName} className="notion-button notion-button-primary"><Download className="h-4 w-4" /> 다운로드</a></div>
            </div>
            <iframe title={`${active.university} 2028 대입전형 시행계획`} src={active.file} className="h-[72vh] w-full bg-white" />
          </section>
        ) : <EmptyState title="검색 결과가 없습니다." />}
      </div>
    </>
  );
}
