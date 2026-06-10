import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api-server";
import {
  getAdminSupabase,
  getPublicSupabase,
  hasAdminSupabaseConfig,
  hasPublicSupabaseConfig,
  isAdminRequest,
} from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type ServiceCheck = {
  id: string;
  label: string;
  ok: boolean;
  guidance: string;
};

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return jsonError("관리자 인증이 필요합니다.", 401);
  }

  const checks: ServiceCheck[] = [
    {
      id: "public-config",
      label: "Supabase 공개 연결 설정",
      ok: hasPublicSupabaseConfig(),
      guidance: "Vercel에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.",
    },
    {
      id: "admin-config",
      label: "서버 비밀 키",
      ok: hasAdminSupabaseConfig(),
      guidance: "Vercel에 SUPABASE_SECRET_KEY 또는 SUPABASE_SERVICE_ROLE_KEY를 설정하세요.",
    },
  ];

  const publicClient = getPublicSupabase();
  if (publicClient) {
    for (const table of [
      { id: "notices", label: "공지사항 테이블", name: "notices" },
      { id: "class-items", label: "평가·제출 일정 테이블", name: "class_items" },
      { id: "roadmap-items", label: "월별 로드맵 테이블", name: "roadmap_items" },
    ]) {
      const { error } = await publicClient.from(table.name).select("id").limit(1);
      checks.push({
        id: table.id,
        label: table.label,
        ok: !error,
        guidance: error
          ? table.name === "roadmap_items"
            ? "Supabase SQL Editor에서 20260611_student_tools.sql을 실행하세요."
            : "Supabase SQL Editor에서 20260610_public_class_hub.sql을 실행하세요."
          : "",
      });
    }
  } else {
    for (const table of [
      ["notices", "공지사항 테이블"],
      ["class-items", "평가·제출 일정 테이블"],
      ["roadmap-items", "월별 로드맵 테이블"],
    ]) {
      checks.push({
        id: table[0],
        label: table[1],
        ok: false,
        guidance: "Supabase 공개 연결 환경변수를 먼저 설정하세요.",
      });
    }
  }

  const adminClient = getAdminSupabase();
  if (adminClient) {
    const { data, error } = await adminClient.storage.getBucket("class-files");
    checks.push({
      id: "storage",
      label: "첨부파일 Storage",
      ok: !error && Boolean(data),
      guidance:
        error || !data
          ? "Supabase SQL Editor에서 20260610_public_class_hub.sql을 실행하세요."
          : "",
    });
  } else {
    checks.push({
      id: "storage",
      label: "첨부파일 Storage",
      ok: false,
      guidance: "서버 비밀 키를 설정한 뒤 다시 확인하세요.",
    });
  }

  return jsonData({
    ok: checks.every((check) => check.ok),
    checks,
  });
}
