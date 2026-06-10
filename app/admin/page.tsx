"use client";

import { PageHeader } from "@/components/page-header";
import { clearAdminPassword, getAdminPassword, setAdminPassword } from "@/lib/notices";
import { LogIn, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "5314";

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setAuthenticated(Boolean(getAdminPassword())),
      0,
    );
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <>
      <PageHeader title="관리자" description="공지사항 작성을 위한 관리자 인증 페이지입니다." crumbs={[{ label: "홈", href: "/" }, { label: "관리자" }]} />
      <div className="mx-auto max-w-md notion-card p-6">
        {authenticated ? (
          <div className="space-y-3">
            <p className="text-sm text-[#615d59]">관리자로 로그인되어 있습니다.</p>
            <button type="button" onClick={() => router.push("/admin/notices/new")} className="notion-button notion-button-primary w-full">공지 작성</button>
            <button type="button" onClick={() => { clearAdminPassword(); setAuthenticated(false); }} className="notion-button w-full"><LogOut className="h-4 w-4" /> 로그아웃</button>
          </div>
        ) : (
          <div className="space-y-3">
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="notion-input w-full" placeholder="관리자 비밀번호" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="button" onClick={() => { if (password === PASSWORD) { setAdminPassword(password); setAuthenticated(true); setError(""); } else setError("비밀번호가 올바르지 않습니다."); }} className="notion-button notion-button-primary w-full"><LogIn className="h-4 w-4" /> 로그인</button>
          </div>
        )}
      </div>
    </>
  );
}
