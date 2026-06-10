import { NextRequest } from "next/server";
import { jsonData, jsonError, parseId, requireAdmin } from "@/lib/api-server";
import { careerResourceCategories } from "@/lib/content";
import {
  cleanText,
  getPublicSupabase,
  nullableText,
} from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const payload = (body: Record<string, unknown>) => ({
  category: careerResourceCategories.includes(body.category as never)
    ? body.category
    : "가이드",
  title: cleanText(body.title),
  summary: cleanText(body.summary),
  key_points: Array.isArray(body.key_points)
    ? body.key_points.map(cleanText).filter(Boolean)
    : cleanText(body.key_points)
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
  content: nullableText(body.content),
  link_url: nullableText(body.link_url),
  attachment_url: nullableText(body.attachment_url),
  attachment_name: nullableText(body.attachment_name),
});

export async function GET() {
  const supabase = getPublicSupabase();
  if (!supabase) return jsonError("Supabase 환경 변수가 설정되어 있지 않습니다.");
  const { data, error } = await supabase
    .from("career_resources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return jsonError(error.message);
  return jsonData(data ?? []);
}
export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin.error) return admin.error;
  const resource = payload(
    ((await request.json().catch(() => null)) as Record<string, unknown>) ?? {},
  );
  if (!resource.title || !resource.summary) {
    return jsonError("제목과 요약을 입력하세요.", 400);
  }
  const { error } = await admin.client.from("career_resources").insert([resource]);
  if (error) return jsonError(error.message);
  return jsonData({ ok: true }, 201);
}

export async function PATCH(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin.error) return admin.error;
  const id = parseId(request);
  if (!id) return jsonError("진학자료 ID가 올바르지 않습니다.", 400);
  const resource = payload(
    ((await request.json().catch(() => null)) as Record<string, unknown>) ?? {},
  );
  if (!resource.title || !resource.summary) {
    return jsonError("제목과 요약을 입력하세요.", 400);
  }
  const { error } = await admin.client
    .from("career_resources")
    .update(resource)
    .eq("id", id);
  if (error) return jsonError(error.message);
  return jsonData({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin.error) return admin.error;
  const id = parseId(request);
  if (!id) return jsonError("삭제할 진학자료 ID가 올바르지 않습니다.", 400);
  const { error } = await admin.client.from("career_resources").delete().eq("id", id);
  if (error) return jsonError(error.message);
  return jsonData({ ok: true });
}
