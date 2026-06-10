"use client";

import { CategoryBadge } from "@/components/content-ui";
import { PageHeader } from "@/components/page-header";
import { parseApiResponse } from "@/lib/client-api";
import type { CareerResource, ClassItem, Notice } from "@/lib/content";
import { clearAdminPassword, getAdminPassword, setAdminPassword } from "@/lib/notices";
import { Edit3, LogIn, LogOut, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "5314";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [items, setItems] = useState<ClassItem[]>([]);
  const [resources, setResources] = useState<CareerResource[]>([]);

  const load = useCallback(async () => {
    try {
      const [noticeRows, itemRows, resourceRows] = await Promise.all([
        parseApiResponse<Notice[]>(fetch("/api/notices", { cache: "no-store" })),
        parseApiResponse<ClassItem[]>(fetch("/api/class-items", { cache: "no-store" })),
        parseApiResponse<CareerResource[]>(fetch("/api/career-resources", { cache: "no-store" })),
      ]);
      setNotices(noticeRows); setItems(itemRows); setResources(resourceRows);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "관리 데이터를 불러오지 못했습니다."); }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const current = getAdminPassword();
      setAuthenticated(Boolean(current));
      if (current) load();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const remove = async (path: string, id: number) => {
    if (!confirm("이 항목을 삭제할까요?")) return;
    try { await parseApiResponse(await fetch(`${path}?id=${id}`, { method: "DELETE", headers: { "x-admin-password": getAdminPassword() } })); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "삭제하지 못했습니다."); }
  };

  if (!authenticated) return <>
    <PageHeader title="관리자" description="담임용 콘텐츠 관리 페이지입니다." crumbs={[{ label: "홈", href: "/" }, { label: "관리자" }]} />
    <div className="mx-auto max-w-md notion-card space-y-3 p-6"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="notion-input w-full" placeholder="관리자 비밀번호" />{error && <p className="text-sm text-red-600">{error}</p>}<button type="button" onClick={() => { if (password === PASSWORD) { setAdminPassword(password); setAuthenticated(true); setError(""); load(); } else setError("비밀번호가 올바르지 않습니다."); }} className="notion-button notion-button-primary w-full"><LogIn className="h-4 w-4" /> 로그인</button></div>
  </>;

  const sections = [
    { title: "공지사항", rows: notices, newHref: "/admin/notices/new", api: "/api/notices", edit: (id: number) => `/admin/notices/new?id=${id}`, label: (row: Notice) => row.title, badge: (row: Notice) => row.category },
    { title: "평가·제출·준비물", rows: items, newHref: "/admin/class-items/new", api: "/api/class-items", edit: (id: number) => `/admin/class-items/new?id=${id}`, label: (row: ClassItem) => `${row.date} · ${row.title}`, badge: (row: ClassItem) => row.item_type },
    { title: "진학 가이드·용어사전", rows: resources, newHref: "/admin/career-resources/new", api: "/api/career-resources", edit: (id: number) => `/admin/career-resources/new?id=${id}`, label: (row: CareerResource) => row.title, badge: (row: CareerResource) => row.category },
  ];

  return <>
    <PageHeader title="콘텐츠 관리" description="학생 화면에 표시할 공지, 일정과 진학자료를 관리합니다." crumbs={[{ label: "홈", href: "/" }, { label: "관리자" }]} actions={<button type="button" onClick={() => { clearAdminPassword(); setAuthenticated(false); }} className="notion-button"><LogOut className="h-4 w-4" /> 로그아웃</button>} />
    {error && <p className="mb-5 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="space-y-8">{sections.map((section) => <section key={section.title}><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">{section.title}</h2><Link href={section.newHref} className="notion-button notion-button-primary"><Plus className="h-4 w-4" /> 새 항목</Link></div><div className="notion-card divide-y divide-[#e6e6e6]">{section.rows.length ? section.rows.slice(0, 20).map((row) => <div key={row.id} className="flex items-center justify-between gap-4 p-4"><div className="min-w-0"><CategoryBadge label={section.badge(row as never)} /><p className="mt-2 truncate text-sm font-medium">{section.label(row as never)}</p></div><div className="flex shrink-0 gap-1"><Link href={section.edit(row.id)} className="rounded-md p-2 text-[#787774] hover:bg-[#f1f1ef]" title="수정"><Edit3 className="h-4 w-4" /></Link><button type="button" onClick={() => remove(section.api, row.id)} className="rounded-md p-2 text-[#787774] hover:bg-red-50 hover:text-red-600" title="삭제"><Trash2 className="h-4 w-4" /></button></div></div>) : <p className="p-6 text-center text-sm text-[#787774]">등록된 항목이 없습니다.</p>}</div></section>)}</div>
  </>;
}
