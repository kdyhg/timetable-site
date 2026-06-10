"use client";

import { staticCareerResources } from "@/app/career-guides-data";
import { CategoryBadge, ResourceLinks } from "@/components/content-ui";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui";
import { parseApiResponse } from "@/lib/client-api";
import { careerResourceCategories, type CareerResource, type CareerResourceCategory } from "@/lib/content";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Filter = "전체" | CareerResourceCategory;

export default function CareerGuidesPage() {
  const [managed, setManaged] = useState<CareerResource[]>([]);
  const [filter, setFilter] = useState<Filter>("전체");
  const [query, setQuery] = useState("");
  const [warning, setWarning] = useState("");
  const resources = useMemo(() => [...managed, ...staticCareerResources].filter((resource) => {
    const search = query.trim().toLocaleLowerCase("ko");
    return (filter === "전체" || resource.category === filter) && (!search || [resource.title, resource.summary, resource.content, ...resource.key_points].join(" ").toLocaleLowerCase("ko").includes(search));
  }), [filter, managed, query]);

  useEffect(() => {
    parseApiResponse<CareerResource[]>(fetch("/api/career-resources", { cache: "no-store" }))
      .then(setManaged)
      .catch(() => setWarning("담임이 추가한 진학자료를 불러오지 못해 기본 안내만 표시합니다."));
  }, []);

  return <>
    <PageHeader title="진학 가이드·용어사전" description="전형자료를 읽기 전에 알아두면 좋은 핵심 설명과 용어를 확인하세요." crumbs={[{ label: "홈", href: "/" }, { label: "2028 진로진학", href: "/career/2028" }, { label: "진학 가이드" }]} />
    {warning && <p className="mb-5 rounded-md bg-amber-50 p-3 text-sm text-amber-800">{warning}</p>}
    <div className="notion-card mb-6 flex flex-col gap-3 p-4 md:flex-row">
      <input value={query} onChange={(event) => setQuery(event.target.value)} className="notion-input flex-1" placeholder="진학 용어와 안내 검색" />
      <div className="flex gap-1 overflow-x-auto">{(["전체", ...careerResourceCategories] as Filter[]).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium ${filter === item ? "bg-[#e9e9e7]" : "text-[#787774] hover:bg-[#f3f3f2]"}`}>{item}</button>)}</div>
    </div>
    {resources.length ? <div className="grid gap-4 lg:grid-cols-2">{resources.map((resource) => <article key={resource.id} className="notion-card p-6"><CategoryBadge label={resource.category} /><h2 className="mt-4 text-lg font-semibold">{resource.title}</h2><p className="mt-2 text-sm leading-6 text-[#615d59]">{resource.summary}</p>{resource.key_points.length > 0 && <ul className="mt-5 space-y-2">{resource.key_points.map((point) => <li key={point} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0075de]" /><span>{point}</span></li>)}</ul>}{resource.content && <p className="mt-5 whitespace-pre-wrap border-t border-[#e6e6e6] pt-5 text-sm leading-7 text-[#31302e]">{resource.content}</p>}<ResourceLinks linkUrl={resource.link_url} attachmentUrl={resource.attachment_url} attachmentName={resource.attachment_name} /></article>)}</div> : <EmptyState title="검색 결과가 없습니다." />}
  </>;
}
