"use client";

import { PageHeader } from "@/components/page-header";
import { adminHeaders, parseApiResponse } from "@/lib/client-api";
import type { RoadmapItem } from "@/lib/content";
import { getAdminPassword } from "@/lib/notices";
import { Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function RoadmapItemForm() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState({
    month: "",
    title: "",
    description: "",
    action_points: "",
    link_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    const current = getAdminPassword();
    if (!current) {
      router.replace("/admin");
      return;
    }
    setPassword(current);
    if (id) {
      parseApiResponse<RoadmapItem[]>(
        fetch("/api/roadmap-items", { cache: "no-store" }),
      ).then((rows) => {
        const row = rows.find((item) => item.id === Number(id));
        if (row) {
          setForm({
            month: row.month,
            title: row.title,
            description: row.description,
            action_points: row.action_points.join("\n"),
            link_url: row.link_url || "",
          });
        }
      });
    }
  }, [id, router]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await parseApiResponse(
        await fetch(`/api/roadmap-items${id ? `?id=${id}` : ""}`, {
          method: id ? "PATCH" : "POST",
          headers: adminHeaders(password),
          body: JSON.stringify({
            ...form,
            action_points: form.action_points
              .split("\n")
              .map((point) => point.trim())
              .filter(Boolean),
          }),
        }),
      );
      router.push("/admin");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "로드맵 저장에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={id ? "월별 로드맵 수정" : "월별 로드맵 등록"}
        description="학생들이 이번 달에 집중할 내용과 행동 포인트를 등록하세요."
        crumbs={[
          { label: "홈", href: "/" },
          { label: "관리자", href: "/admin" },
          { label: id ? "로드맵 수정" : "로드맵 등록" },
        ]}
      />
      <div className="mx-auto max-w-3xl notion-card space-y-5 p-4 sm:p-6">
        <label className="block space-y-1.5 text-sm font-medium">
          <span>월</span>
          <input
            type="month"
            value={form.month}
            onChange={(event) => set("month", event.target.value)}
            className="notion-input w-full font-normal"
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          <span>제목</span>
          <input
            value={form.title}
            onChange={(event) => set("title", event.target.value)}
            className="notion-input w-full font-normal"
            placeholder="예: 6월, 2차고사와 과목 선택 점검"
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          <span>설명</span>
          <textarea
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
            className="notion-input min-h-28 w-full resize-y font-normal"
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          <span>행동 포인트</span>
          <textarea
            value={form.action_points}
            onChange={(event) => set("action_points", event.target.value)}
            className="notion-input min-h-32 w-full resize-y font-normal"
            placeholder={"한 줄에 하나씩 입력\n예: 수행평가 마감일 확인"}
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          <span>관련 링크 (선택)</span>
          <input
            type="url"
            value={form.link_url}
            onChange={(event) => set("link_url", event.target.value)}
            className="notion-input w-full font-normal"
          />
        </label>
        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="notion-button notion-button-primary w-full disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "저장 중..." : "로드맵 저장"}
        </button>
      </div>
    </>
  );
}

export default function RoadmapItemFormPage() {
  return (
    <Suspense>
      <RoadmapItemForm />
    </Suspense>
  );
}
