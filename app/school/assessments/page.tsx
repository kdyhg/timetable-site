"use client";

import { ClassItemCard } from "@/components/content-ui";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui";
import { parseApiResponse } from "@/lib/client-api";
import { classItemTypes, type ClassItem, type ClassItemType } from "@/lib/content";
import { getLocalDateString } from "@/lib/school";
import { useEffect, useMemo, useState } from "react";

type Filter = "전체" | ClassItemType;

export default function AssessmentsPage() {
  const [items, setItems] = useState<ClassItem[]>([]);
  const [filter, setFilter] = useState<Filter>("전체");
  const today = getLocalDateString();
  const filtered = useMemo(
    () => items.filter((item) => filter === "전체" || item.item_type === filter),
    [filter, items],
  );
  const upcoming = filtered.filter((item) => (item.end_date || item.date) >= today);
  const past = filtered.filter((item) => (item.end_date || item.date) < today).reverse();

  useEffect(() => {
    parseApiResponse<ClassItem[]>(fetch("/api/class-items", { cache: "no-store" }))
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <>
      <PageHeader
        title="평가·제출 일정"
        description="시험, 수행평가, 제출일과 준비물을 날짜순으로 확인하세요."
        crumbs={[{ label: "홈", href: "/" }, { label: "학교생활" }, { label: "평가·제출 일정" }]}
        actions={<div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-[#e6e6e6] bg-white p-1">{(["전체", ...classItemTypes] as Filter[]).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`min-h-11 shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${filter === item ? "bg-[#e9e9e7]" : "text-[#787774] hover:bg-[#f3f3f2]"}`}>{item}</button>)}</div>}
      />
      {upcoming.length ? <div className="grid gap-4 md:grid-cols-2">{upcoming.map((item) => <ClassItemCard key={item.id} item={item} />)}</div> : <EmptyState title="예정된 일정이 없습니다." />}
      {past.length > 0 && <details className="mt-8"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-[#787774]">지난 일정 {past.length}개</summary><div className="mt-4 grid gap-4 opacity-75 md:grid-cols-2">{past.map((item) => <ClassItemCard key={item.id} item={item} />)}</div></details>}
    </>
  );
}
