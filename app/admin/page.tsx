"use client";

import { CategoryBadge } from "@/components/content-ui";
import { PageHeader } from "@/components/page-header";
import { parseApiResponse } from "@/lib/client-api";
import type { CareerResource, ClassItem, Notice } from "@/lib/content";
import { clearAdminPassword, getAdminPassword, setAdminPassword } from "@/lib/notices";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "5314";

type SystemStatus = {
  ok: boolean;
  checks: {
    id: string;
    label: string;
    ok: boolean;
    guidance: string;
  }[];
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [items, setItems] = useState<ClassItem[]>([]);
  const [resources, setResources] = useState<CareerResource[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const load = useCallback(async () => {
    setError("");
    const [noticeResult, itemResult, resourceResult] = await Promise.allSettled([
        parseApiResponse<Notice[]>(fetch("/api/notices", { cache: "no-store" })),
        parseApiResponse<ClassItem[]>(fetch("/api/class-items", { cache: "no-store" })),
        parseApiResponse<CareerResource[]>(fetch("/api/career-resources", { cache: "no-store" })),
      ]);
    if (noticeResult.status === "fulfilled") setNotices(noticeResult.value);
    if (itemResult.status === "fulfilled") setItems(itemResult.value);
    if (resourceResult.status === "fulfilled") setResources(resourceResult.value);
    if ([noticeResult, itemResult, resourceResult].some((result) => result.status === "rejected")) {
      setError("일부 관리 데이터를 불러오지 못했습니다. 아래 서비스 상태를 확인하세요.");
    }
  }, []);

  const checkSystem = useCallback(async () => {
    const current = getAdminPassword();
    if (!current) return;
    setCheckingStatus(true);
    try {
      setSystemStatus(
        await parseApiResponse<SystemStatus>(
          fetch("/api/system-status", {
            cache: "no-store",
            headers: { "x-admin-password": current },
          }),
        ),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "서비스 상태를 확인하지 못했습니다.");
    } finally {
      setCheckingStatus(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const current = getAdminPassword();
      setAuthenticated(Boolean(current));
      if (current) {
        load();
        checkSystem();
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [checkSystem, load]);

  const remove = async (path: string, id: number) => {
    if (!confirm("이 항목을 삭제할까요?")) return;
    try { await parseApiResponse(await fetch(`${path}?id=${id}`, { method: "DELETE", headers: { "x-admin-password": getAdminPassword() } })); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "삭제하지 못했습니다."); }
  };

  if (!authenticated) return <>
    <PageHeader title="관리자" description="담임용 콘텐츠 관리 페이지입니다." crumbs={[{ label: "홈", href: "/" }, { label: "관리자" }]} />
    <div className="mx-auto max-w-md notion-card space-y-3 p-5 sm:p-6"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="notion-input w-full" placeholder="관리자 비밀번호" />{error && <p className="text-sm text-red-600">{error}</p>}<button type="button" onClick={() => { if (password === PASSWORD) { setAdminPassword(password); setAuthenticated(true); setError(""); load(); window.setTimeout(checkSystem, 0); } else setError("비밀번호가 올바르지 않습니다."); }} className="notion-button notion-button-primary w-full"><LogIn className="h-4 w-4" /> 로그인</button></div>
  </>;

  const sections = [
    { title: "공지사항", rows: notices, newHref: "/admin/notices/new", api: "/api/notices", edit: (id: number) => `/admin/notices/new?id=${id}`, label: (row: Notice) => row.title, badge: (row: Notice) => row.category },
    { title: "평가·제출·준비물", rows: items, newHref: "/admin/class-items/new", api: "/api/class-items", edit: (id: number) => `/admin/class-items/new?id=${id}`, label: (row: ClassItem) => `${row.date} · ${row.title}`, badge: (row: ClassItem) => row.item_type },
    { title: "진학 가이드·용어사전", rows: resources, newHref: "/admin/career-resources/new", api: "/api/career-resources", edit: (id: number) => `/admin/career-resources/new?id=${id}`, label: (row: CareerResource) => row.title, badge: (row: CareerResource) => row.category },
  ];

  return <>
    <PageHeader title="콘텐츠 관리" description="학생 화면에 표시할 공지, 일정과 진학자료를 관리합니다." crumbs={[{ label: "홈", href: "/" }, { label: "관리자" }]} actions={<button type="button" onClick={() => { clearAdminPassword(); setAuthenticated(false); }} className="notion-button"><LogOut className="h-4 w-4" /> 로그아웃</button>} />
    {error && <p className="mb-5 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">서비스 상태</h2>
          <p className="mt-1 text-sm text-[#787774]">데이터베이스와 첨부파일 설정을 확인합니다.</p>
        </div>
        <button type="button" onClick={checkSystem} disabled={checkingStatus} className="notion-button shrink-0 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${checkingStatus ? "animate-spin" : ""}`} /> 다시 확인
        </button>
      </div>
      <div className="notion-card divide-y divide-[#e6e6e6]">
        {systemStatus?.checks.map((check) => (
          <div key={check.id} className="flex items-start gap-3 p-4">
            {check.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />}
            <div>
              <p className="text-sm font-semibold">{check.label}</p>
              <p className={`mt-1 text-xs leading-5 ${check.ok ? "text-emerald-700" : "text-amber-800"}`}>{check.ok ? "정상" : check.guidance}</p>
            </div>
          </div>
        ))}
        {!systemStatus && <p className="p-6 text-center text-sm text-[#787774]">서비스 상태를 확인하는 중입니다.</p>}
      </div>
      {systemStatus && !systemStatus.ok && (
        <details className="notion-card mt-3">
          <summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-semibold">
            처음 설정하는 순서
          </summary>
          <ol className="list-decimal space-y-2 border-t border-[#e6e6e6] px-8 py-4 text-sm leading-6 text-[#615d59]">
            <li>Supabase SQL Editor에서 <b>20260610_public_class_hub.sql</b> 전체를 실행합니다.</li>
            <li>Vercel Production 환경에 Supabase 서버 비밀 키와 관리자 비밀번호를 설정합니다.</li>
            <li>Vercel에서 최신 Production 배포를 다시 배포합니다.</li>
            <li>배포 후 이 화면에서 <b>다시 확인</b>을 누릅니다.</li>
          </ol>
        </details>
      )}
    </section>
    <div className="space-y-8">{sections.map((section) => <section key={section.title}><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{section.title}</h2><Link href={section.newHref} className="notion-button notion-button-primary shrink-0"><Plus className="h-4 w-4" /> 새 항목</Link></div><div className="notion-card divide-y divide-[#e6e6e6]">{section.rows.length ? section.rows.slice(0, 20).map((row) => <div key={row.id} className="flex items-center justify-between gap-4 p-4"><div className="min-w-0"><CategoryBadge label={section.badge(row as never)} /><p className="mt-2 truncate text-sm font-medium">{section.label(row as never)}</p></div><div className="flex shrink-0 gap-1"><Link href={section.edit(row.id)} className="touch-icon-button" title="수정"><Edit3 className="h-4 w-4" /></Link><button type="button" onClick={() => remove(section.api, row.id)} className="touch-icon-button hover:bg-red-50 hover:text-red-600" title="삭제"><Trash2 className="h-4 w-4" /></button></div></div>) : <p className="p-6 text-center text-sm text-[#787774]">등록된 항목이 없습니다.</p>}</div></section>)}</div>
  </>;
}
