"use client";

import { CategoryBadge } from "@/components/content-ui";
import { PageHeader } from "@/components/page-header";
import { parseApiResponse } from "@/lib/client-api";
import type { Notice } from "@/lib/content";
import { clearAdminPassword, getAdminPassword, setAdminPassword } from "@/lib/notices";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Edit3,
  LogIn,
  LogOut,
  MoonStar,
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
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setNotices(
        await parseApiResponse<Notice[]>(
          fetch("/api/notices", { cache: "no-store" }),
        ),
      );
    } catch {
      setError("공지사항을 불러오지 못했습니다. 아래 서비스 상태를 확인하세요.");
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

  return <>
    <PageHeader title="콘텐츠 관리" description="학급 공지와 야간자율학습 명단을 관리합니다." crumbs={[{ label: "홈", href: "/" }, { label: "관리자" }]} actions={<button type="button" onClick={() => { clearAdminPassword(); setAuthenticated(false); }} className="notion-button"><LogOut className="h-4 w-4" /> 로그아웃</button>} />
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
            <li>Supabase SQL Editor에서 <b>20260610_public_class_hub.sql</b>, <b>20260706_notice_image_position.sql</b>, <b>20260828_evening_study.sql</b>을 실행합니다.</li>
            <li>Vercel Production 환경에 Supabase 서버 비밀 키와 관리자 비밀번호를 설정합니다.</li>
            <li>Vercel에서 최신 Production 배포를 다시 배포합니다.</li>
            <li>배포 후 이 화면에서 <b>다시 확인</b>을 누릅니다.</li>
          </ol>
        </details>
      )}
    </section>
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">야간자율학습</h2>
        <p className="mt-1 text-sm text-[#787774]">요일별 명단과 종료 차시, 운영 시간을 관리합니다.</p>
      </div>
      <Link href="/admin/evening-study" className="notion-card flex min-h-20 items-center justify-between gap-4 p-4 transition-colors hover:bg-[#fbfbfa]">
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7f2fc] text-[#0075de]"><MoonStar className="h-5 w-5" /></span>
          <span><span className="block text-sm font-semibold">명단 및 시간 수정</span><span className="mt-1 block text-xs text-[#787774]">월~금 기본 명단을 관리합니다.</span></span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-[#a39e98]" />
      </Link>
    </section>
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">공지사항</h2>
        <Link href="/admin/notices/new" className="notion-button notion-button-primary shrink-0"><Plus className="h-4 w-4" /> 새 공지</Link>
      </div>
      <div className="notion-card divide-y divide-[#e6e6e6]">
        {notices.length ? notices.slice(0, 30).map((notice) => (
          <div key={notice.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <CategoryBadge label={notice.category} />
              <p className="mt-2 truncate text-sm font-medium">{notice.title}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Link href={`/admin/notices/new?id=${notice.id}`} className="touch-icon-button" title="수정"><Edit3 className="h-4 w-4" /></Link>
              <button type="button" onClick={() => remove("/api/notices", notice.id)} className="touch-icon-button hover:bg-red-50 hover:text-red-600" title="삭제"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        )) : <p className="p-6 text-center text-sm text-[#787774]">등록된 공지가 없습니다.</p>}
      </div>
    </section>
  </>;
}
