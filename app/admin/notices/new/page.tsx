"use client";

import { AttachmentFields } from "@/components/admin-fields";
import { PageHeader } from "@/components/page-header";
import { adminHeaders, parseApiResponse } from "@/lib/client-api";
import { noticeCategories, type Notice, type NoticeCategory } from "@/lib/content";
import { getAdminPassword } from "@/lib/notices";
import { Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function NoticeForm() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState({ title: "", content: "", category: "일반" as NoticeCategory, is_important: false, due_date: "", publish_start: "", publish_end: "", link_url: "", attachment_url: "", attachment_name: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    const current = getAdminPassword(); if (!current) { router.replace("/admin"); return; } setPassword(current);
    if (id) parseApiResponse<Notice[]>(fetch("/api/notices", { cache: "no-store" })).then((rows) => { const row = rows.find((item) => item.id === Number(id)); if (row) setForm({ title: row.title, content: row.content, category: row.category, is_important: row.is_important, due_date: row.due_date || "", publish_start: row.publish_start || "", publish_end: row.publish_end || "", link_url: row.link_url || "", attachment_url: row.attachment_url || "", attachment_name: row.attachment_name || "" }); });
  }, [id, router]);

  const save = async () => {
    setSaving(true); setError("");
    try { await parseApiResponse(await fetch(`/api/notices${id ? `?id=${id}` : ""}`, { method: id ? "PATCH" : "POST", headers: adminHeaders(password), body: JSON.stringify(form) })); router.push("/admin"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "공지 저장에 실패했습니다."); }
    finally { setSaving(false); }
  };

  return <>
    <PageHeader title={id ? "공지 수정" : "공지 작성"} description="학생에게 전달할 공지와 게시 기간, 첨부자료를 입력하세요." crumbs={[{ label: "홈", href: "/" }, { label: "관리자", href: "/admin" }, { label: id ? "공지 수정" : "공지 작성" }]} />
    <div className="mx-auto max-w-3xl notion-card space-y-5 p-4 sm:p-6">
      <input value={form.title} onChange={(event) => set("title", event.target.value)} className="notion-input w-full" placeholder="공지 제목" disabled={saving} />
      <div className="grid gap-4 lg:grid-cols-2"><label className="space-y-1.5 text-sm font-medium"><span>분류</span><select value={form.category} onChange={(event) => set("category", event.target.value)} className="notion-input w-full font-normal">{noticeCategories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={form.is_important} onChange={(event) => set("is_important", event.target.checked)} /> 홈 상단 중요 공지로 고정</label></div>
      <textarea value={form.content} onChange={(event) => set("content", event.target.value)} className="notion-input min-h-56 w-full resize-y" placeholder="공지 내용" disabled={saving} />
      <div className="grid gap-4 lg:grid-cols-3">{[["due_date", "마감일"], ["publish_start", "게시 시작일"], ["publish_end", "게시 종료일"]].map(([key, label]) => <label key={key} className="space-y-1.5 text-sm font-medium"><span>{label}</span><input type="date" value={form[key as "due_date"]} onChange={(event) => set(key as keyof typeof form, event.target.value)} className="notion-input w-full font-normal" /></label>)}</div>
      <AttachmentFields password={password} linkUrl={form.link_url} onLinkUrl={(value) => set("link_url", value)} attachmentUrl={form.attachment_url} attachmentName={form.attachment_name} onAttachment={(url, name) => setForm((current) => ({ ...current, attachment_url: url, attachment_name: name }))} disabled={saving} />
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button type="button" onClick={save} disabled={saving} className="notion-button notion-button-primary w-full disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? "저장 중..." : "공지 저장"}</button>
    </div>
  </>;
}

export default function NoticeFormPage() { return <Suspense><NoticeForm /></Suspense>; }
