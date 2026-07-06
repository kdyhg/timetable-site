"use client";

import {
  NoticeBodyWithImage,
  NoticeImageIndicator,
  NoticeMeta,
  ResourceLinks,
} from "@/components/content-ui";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui";
import { parseApiResponse } from "@/lib/client-api";
import {
  isExpiredNotice,
  isVisibleNotice,
  noticeCategories,
  type Notice,
} from "@/lib/content";
import { getAdminPassword } from "@/lib/notices";
import { getLocalDateString } from "@/lib/school";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

function NoticeList({
  notices,
  adminPassword,
  onRemove,
}: {
  notices: Notice[];
  adminPassword: string;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="notion-card divide-y divide-[#e6e6e6]">
      {notices.map((notice) => (
        <article key={notice.id} className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <NoticeMeta notice={notice} />
              <h2 className="mt-3 flex min-w-0 flex-wrap items-center gap-2 break-words font-semibold">
                <span>{notice.title}</span>
                <NoticeImageIndicator notice={notice} />
              </h2>
              <p className="mt-1 text-xs text-[#a39e98]">
                {new Date(notice.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
            {adminPassword && (
              <button
                type="button"
                onClick={() => onRemove(notice.id)}
                className="touch-icon-button shrink-0 hover:bg-red-50 hover:text-red-600"
                title="공지 삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <NoticeBodyWithImage notice={notice} />
          <ResourceLinks
            linkUrl={notice.link_url}
            attachmentUrl={notice.attachment_url}
            attachmentName={notice.attachment_name}
          />
        </article>
      ))}
    </div>
  );
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [category, setCategory] = useState("전체");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminPassword, setAdminPasswordState] = useState("");
  const today = getLocalDateString();
  const filtered = useMemo(
    () =>
      notices.filter(
        (notice) => category === "전체" || notice.category === category,
      ),
    [category, notices],
  );
  const active = filtered.filter((notice) => isVisibleNotice(notice, today));
  const expired = filtered.filter((notice) => isExpiredNotice(notice, today));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setNotices(
        await parseApiResponse<Notice[]>(
          fetch("/api/notices", { cache: "no-store" }),
        ),
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "공지사항을 불러오지 못했습니다.",
      );
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
      await parseApiResponse(
        fetch(`/api/notices?id=${id}`, {
          method: "DELETE",
          headers: { "x-admin-password": adminPassword },
        }),
      );
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "삭제하지 못했습니다.");
    }
  };

  return (
    <>
      <PageHeader
        title="학급 공지사항"
        description="분류별 공지와 마감일, 첨부자료를 확인하세요."
        crumbs={[
          { label: "홈", href: "/" },
          { label: "학교생활" },
          { label: "공지사항" },
        ]}
        actions={
          adminPassword ? (
            <Link
              href="/admin/notices/new"
              className="notion-button notion-button-primary"
            >
              <Plus className="h-4 w-4" /> 공지 작성
            </Link>
          ) : undefined
        }
      />
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg border border-[#e6e6e6] bg-white p-1">
        {["전체", ...noticeCategories].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`min-h-11 shrink-0 rounded-md px-3 py-2 text-sm font-medium ${
              category === item
                ? "bg-[#e9e9e7]"
                : "text-[#787774] hover:bg-[#f3f3f2]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      {error && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <div className="notion-card p-8 text-center text-sm text-[#787774]">
          공지사항을 불러오는 중입니다.
        </div>
      ) : active.length ? (
        <NoticeList
          notices={active}
          adminPassword={adminPassword}
          onRemove={remove}
        />
      ) : (
        <EmptyState title="현재 확인할 공지가 없습니다." />
      )}
      {expired.length > 0 && (
        <details className="mt-8">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-[#787774]">
            기간이 지난 공지 {expired.length}개
          </summary>
          <div className="mt-4 opacity-70">
            <NoticeList
              notices={expired}
              adminPassword={adminPassword}
              onRemove={remove}
            />
          </div>
        </details>
      )}
    </>
  );
}
