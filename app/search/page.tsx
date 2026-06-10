"use client";

import type { SearchResult } from "@/app/api/search/route";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui";
import { parseApiResponse } from "@/lib/client-api";
import { ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function SearchContent() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") || "";
  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(Boolean(initial));

  const run = useCallback(async (target: string) => {
    if (!target.trim()) { setResults([]); return; }
    setLoading(true);
    try { setResults(await parseApiResponse<SearchResult[]>(fetch(`/api/search?q=${encodeURIComponent(target.trim())}`))); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (initial) run(initial); }, [initial, run]);

  return <>
    <PageHeader title="통합 검색" description="공지, 일정, 월별 로드맵과 대학·학과 정보를 한 번에 검색하세요." crumbs={[{ label: "홈", href: "/" }, { label: "통합 검색" }]} />
    <form onSubmit={(event) => { event.preventDefault(); run(query); }} className="notion-card mb-6 flex flex-col gap-2 p-3 sm:flex-row sm:p-4"><input value={query} onChange={(event) => setQuery(event.target.value)} className="notion-input min-w-0 flex-1" placeholder="검색어를 입력하세요" /><button className="notion-button notion-button-primary" type="submit"><Search className="h-4 w-4" /> 검색</button></form>
    {loading ? <div className="notion-card p-8 text-center text-sm text-[#787774]">검색 중입니다.</div> : results.length ? <><p className="mb-3 text-sm text-[#787774]">검색 결과 {results.length}개</p><div className="notion-card divide-y divide-[#e6e6e6]">{results.map((result) => <Link href={result.href} key={result.id} className="flex items-start justify-between gap-4 p-4 hover:bg-[#fbfbfa]"><div><span className="text-xs font-semibold text-[#0075de]">{result.type}</span><h2 className="mt-1 text-sm font-semibold">{result.title}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#787774]">{result.description}</p></div><ArrowUpRight className="h-4 w-4 shrink-0 text-[#a39e98]" /></Link>)}</div></> : <EmptyState title={query ? "검색 결과가 없습니다." : "검색어를 입력하세요."} />}
  </>;
}

export default function SearchPage() {
  return <Suspense fallback={<div className="notion-card p-8 text-center text-sm text-[#787774]">검색을 준비하는 중입니다.</div>}><SearchContent /></Suspense>;
}
