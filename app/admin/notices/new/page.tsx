"use client";

import { PageHeader } from "@/components/page-header";
import { getAdminPassword, parseNoticeResponse } from "@/lib/notices";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NewNoticePage() {
  const router = useRouter();
  const [adminPassword, setAdminPassword] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [important, setImportant] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const password = getAdminPassword();
    if (!password) router.replace("/admin");
    setAdminPassword(password);
  }, [router]);

  const save = async () => {
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력하세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await parseNoticeResponse(await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify({ title, content, is_important: important }),
      }));
      router.push("/school/notices");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "공지사항을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="공지 작성" description="학생들에게 전달할 학급 공지를 작성하세요." crumbs={[{ label: "홈", href: "/" }, { label: "관리자", href: "/admin" }, { label: "공지 작성" }]} />
      <div className="mx-auto max-w-2xl notion-card space-y-4 p-6">
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="notion-input w-full" placeholder="공지 제목" disabled={saving} />
        <textarea value={content} onChange={(event) => setContent(event.target.value)} className="notion-input min-h-56 w-full resize-y" placeholder="공지 내용" disabled={saving} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={important} onChange={(event) => setImportant(event.target.checked)} /> 중요 공지로 표시</label>
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="button" onClick={save} disabled={saving} className="notion-button notion-button-primary w-full disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? "저장 중..." : "공지 저장"}</button>
      </div>
    </>
  );
}
