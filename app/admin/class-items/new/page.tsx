"use client";

import { AttachmentFields } from "@/components/admin-fields";
import { PageHeader } from "@/components/page-header";
import { adminHeaders, parseApiResponse } from "@/lib/client-api";
import { classItemTypes, type ClassItem, type ClassItemType } from "@/lib/content";
import { getAdminPassword } from "@/lib/notices";
import { Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ClassItemForm() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState({ item_type: "시험" as ClassItemType, title: "", subject: "", date: "", end_date: "", scope: "", preparation: "", details: "", link_url: "", attachment_url: "", attachment_name: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    const current = getAdminPassword(); if (!current) { router.replace("/admin"); return; } setPassword(current);
    if (id) parseApiResponse<ClassItem[]>(fetch("/api/class-items", { cache: "no-store" })).then((rows) => { const row = rows.find((item) => item.id === Number(id)); if (row) setForm({ item_type: row.item_type, title: row.title, subject: row.subject || "", date: row.date, end_date: row.end_date || "", scope: row.scope || "", preparation: row.preparation || "", details: row.details || "", link_url: row.link_url || "", attachment_url: row.attachment_url || "", attachment_name: row.attachment_name || "" }); });
  }, [id, router]);

  const save = async () => {
    setSaving(true); setError("");
    try { await parseApiResponse(await fetch(`/api/class-items${id ? `?id=${id}` : ""}`, { method: id ? "PATCH" : "POST", headers: adminHeaders(password), body: JSON.stringify(form) })); router.push("/admin"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "일정 저장에 실패했습니다."); }
    finally { setSaving(false); }
  };

  return <>
    <PageHeader title={id ? "일정 수정" : "평가·제출 일정 등록"} description="시험, 수행평가, 제출일 또는 준비물을 등록하세요." crumbs={[{ label: "홈", href: "/" }, { label: "관리자", href: "/admin" }, { label: id ? "일정 수정" : "일정 등록" }]} />
    <div className="mx-auto max-w-3xl notion-card space-y-5 p-6">
      <div className="grid gap-4 md:grid-cols-2"><label className="space-y-1.5 text-sm font-medium"><span>유형</span><select value={form.item_type} onChange={(event) => set("item_type", event.target.value)} className="notion-input w-full font-normal">{classItemTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label className="space-y-1.5 text-sm font-medium"><span>과목</span><input value={form.subject} onChange={(event) => set("subject", event.target.value)} className="notion-input w-full font-normal" placeholder="예: 수학Ⅱ" /></label></div>
      <label className="block space-y-1.5 text-sm font-medium"><span>제목</span><input value={form.title} onChange={(event) => set("title", event.target.value)} className="notion-input w-full font-normal" placeholder="일정 제목" /></label>
      <div className="grid gap-4 md:grid-cols-2"><label className="space-y-1.5 text-sm font-medium"><span>날짜</span><input type="date" value={form.date} onChange={(event) => set("date", event.target.value)} className="notion-input w-full font-normal" /></label><label className="space-y-1.5 text-sm font-medium"><span>종료일 (선택)</span><input type="date" value={form.end_date} onChange={(event) => set("end_date", event.target.value)} className="notion-input w-full font-normal" /></label></div>
      <label className="block space-y-1.5 text-sm font-medium"><span>시험·평가 범위</span><textarea value={form.scope} onChange={(event) => set("scope", event.target.value)} className="notion-input min-h-24 w-full resize-y font-normal" /></label>
      <label className="block space-y-1.5 text-sm font-medium"><span>준비사항</span><textarea value={form.preparation} onChange={(event) => set("preparation", event.target.value)} className="notion-input min-h-24 w-full resize-y font-normal" /></label>
      <label className="block space-y-1.5 text-sm font-medium"><span>추가 안내</span><textarea value={form.details} onChange={(event) => set("details", event.target.value)} className="notion-input min-h-24 w-full resize-y font-normal" /></label>
      <AttachmentFields password={password} linkUrl={form.link_url} onLinkUrl={(value) => set("link_url", value)} attachmentUrl={form.attachment_url} attachmentName={form.attachment_name} onAttachment={(url, name) => setForm((current) => ({ ...current, attachment_url: url, attachment_name: name }))} disabled={saving} />
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button type="button" onClick={save} disabled={saving} className="notion-button notion-button-primary w-full disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? "저장 중..." : "일정 저장"}</button>
    </div>
  </>;
}

export default function ClassItemFormPage() { return <Suspense><ClassItemForm /></Suspense>; }
