"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui";
import { getAdminPassword, parseNoticeResponse, type Notice } from "@/lib/notices";
import { Pin, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminPassword, setAdminPasswordState] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const body = await parseNoticeResponse(await fetch("/api/notices", { cache: "no-store" }));
      setNotices(body.notices ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "공지사항을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setAdminPasswordState(getAdminPassword());
    load();
  }, [load]);

  const remove = async (id: number) => {
    if (!confirm("공지사항을 삭제할까요?")) return;
    try {
      await parseNoticeResponse(await fetch(`/api/notices?id=${id}`, { method: "DELETE", headers: { "x-admin-password": adminPassword } }));
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "삭제하지 못했습니다.");
    }
  };

  return (
    <>
      <PageHeader
        title="학급 공지사항"
        description="학급의 중요 안내와 최근 공지를 확인하세요."
        crumbs={[{ label: "홈", href: "/" }, { label: "학교생활" }, { label: "공지사항" }]}
        actions={adminPassword ? <Link href="/admin/notices/new" className="notion-button notion-button-primary"><Plus className="h-4 w-4" /> 공지 작성</Link> : undefined}
      />
      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading ? <div className="notion-card p-8 text-center text-sm text-[#787774]">공지사항을 불러오는 중입니다.</div> : notices.length ? (
        <div className="notion-card divide-y divide-[#e6e6e6]">
          {notices.map((notice) => (
            <article key={notice.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    {notice.is_important && <Pin className="h-4 w-4 text-[#0075de]" />}
                    <h2 className="font-semibold">{notice.title}</h2>
                  </div>
                  <p className="mt-1 text-xs text-[#a39e98]">{new Date(notice.created_at).toLocaleDateString("ko-KR")}</p>
                </div>
                {adminPassword && <button type="button" onClick={() => remove(notice.id)} className="rounded-md p-2 text-[#787774] hover:bg-red-50 hover:text-red-600" title="공지 삭제"><Trash2 className="h-4 w-4" /></button>}
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#31302e]">{notice.content}</p>
            </article>
          ))}
        </div>
      ) : <EmptyState title="등록된 공지사항이 없습니다." />}
    </>
  );
}
