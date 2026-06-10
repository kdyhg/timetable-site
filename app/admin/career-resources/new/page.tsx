"use client";

import { AttachmentFields } from "@/components/admin-fields";
import { PageHeader } from "@/components/page-header";
import { adminHeaders, parseApiResponse } from "@/lib/client-api";
import { careerResourceCategories, type CareerResource, type CareerResourceCategory } from "@/lib/content";
import { getAdminPassword } from "@/lib/notices";
import { Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CareerResourceForm() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState({ category: "가이드" as CareerResourceCategory, title: "", summary: "", key_points: "", content: "", link_url: "", attachment_url: "", attachment_name: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    const current = getAdminPassword(); if (!current) { router.replace("/admin"); return; } setPassword(current);
    if (id) parseApiResponse<CareerResource[]>(fetch("/api/career-resources", { cache: "no-store" })).then((rows) => { const row = rows.find((item) => item.id === Number(id)); if (row) setForm({ category: row.category, title: row.title, summary: row.summary, key_points: row.key_points.join("\n"), content: row.content || "", link_url: row.link_url || "", attachment_url: row.attachment_url || "", attachment_name: row.attachment_name || "" }); });
  }, [id, router]);

  const save = async () => {
    setSaving(true); setError("");
    try { await parseApiResponse(await fetch(`/api/career-resources${id ? `?id=${id}` : ""}`, { method: id ? "PATCH" : "POST", headers: adminHeaders(password), body: JSON.stringify(form) })); router.push("/admin"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "진학자료 저장에 실패했습니다."); }
    finally { setSaving(false); }
  };

  return <>
    <PageHeader title={id ? "진학자료 수정" : "진학자료 등록"} description="학생에게 보여줄 담임 설명과 핵심 확인사항을 입력하세요." crumbs={[{ label: "홈", href: "/" }, { label: "관리자", href: "/admin" }, { label: id ? "진학자료 수정" : "진학자료 등록" }]} />
    <div className="mx-auto max-w-3xl notion-card space-y-5 p-6">
      <label className="block space-y-1.5 text-sm font-medium"><span>분류</span><select value={form.category} onChange={(event) => set("category", event.target.value)} className="notion-input w-full font-normal">{careerResourceCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="block space-y-1.5 text-sm font-medium"><span>제목</span><input value={form.title} onChange={(event) => set("title", event.target.value)} className="notion-input w-full font-normal" /></label>
      <label className="block space-y-1.5 text-sm font-medium"><span>짧은 설명</span><textarea value={form.summary} onChange={(event) => set("summary", event.target.value)} className="notion-input min-h-24 w-full resize-y font-normal" /></label>
      <label className="block space-y-1.5 text-sm font-medium"><span>핵심 확인사항 (한 줄에 하나)</span><textarea value={form.key_points} onChange={(event) => set("key_points", event.target.value)} className="notion-input min-h-32 w-full resize-y font-normal" /></label>
      <label className="block space-y-1.5 text-sm font-medium"><span>상세 안내</span><textarea value={form.content} onChange={(event) => set("content", event.target.value)} className="notion-input min-h-48 w-full resize-y font-normal" /></label>
      <AttachmentFields password={password} linkUrl={form.link_url} onLinkUrl={(value) => set("link_url", value)} attachmentUrl={form.attachment_url} attachmentName={form.attachment_name} onAttachment={(url, name) => setForm((current) => ({ ...current, attachment_url: url, attachment_name: name }))} disabled={saving} />
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button type="button" onClick={save} disabled={saving} className="notion-button notion-button-primary w-full disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? "저장 중..." : "진학자료 저장"}</button>
    </div>
  </>;
}

export default function CareerResourceFormPage() { return <Suspense><CareerResourceForm /></Suspense>; }
