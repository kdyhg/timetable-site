import { NextRequest } from "next/server";
import { jsonData, jsonError, parseId, requireAdmin } from "@/lib/api-server";
import { cleanText, getPublicSupabase, nullableText } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const payload = (body: Record<string, unknown>) => ({
  month: cleanText(body.month),
  title: cleanText(body.title),
  description: cleanText(body.description),
  action_points: Array.isArray(body.action_points)
    ? body.action_points.map(cleanText).filter(Boolean)
    : [],
  link_url: nullableText(body.link_url),
});

const valid = (item: ReturnType<typeof payload>) =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(item.month) &&
  Boolean(item.title && item.description);

export async function GET() {
  const supabase = getPublicSupabase();
  if (!supabase) return jsonError("Supabase 환경 변수가 설정되어 있지 않습니다.");
  const { data, error } = await supabase
    .from("roadmap_items")
    .select("*")
    .order("month", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return jsonError(error.message);
  return jsonData(data ?? []);
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin.error) return admin.error;
  const item = payload(
    ((await request.json().catch(() => null)) as Record<string, unknown>) ?? {},
  );
  if (!valid(item)) return jsonError("월, 제목과 설명을 입력하세요.", 400);
  const { error } = await admin.client.from("roadmap_items").insert([item]);
  if (error) return jsonError(error.message);
  return jsonData({ ok: true }, 201);
}

export async function PATCH(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin.error) return admin.error;
  const id = parseId(request);
  if (!id) return jsonError("로드맵 ID가 올바르지 않습니다.", 400);
  const item = payload(
    ((await request.json().catch(() => null)) as Record<string, unknown>) ?? {},
  );
  if (!valid(item)) return jsonError("월, 제목과 설명을 입력하세요.", 400);
  const { error } = await admin.client.from("roadmap_items").update(item).eq("id", id);
  if (error) return jsonError(error.message);
  return jsonData({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin.error) return admin.error;
  const id = parseId(request);
  if (!id) return jsonError("삭제할 로드맵 ID가 올바르지 않습니다.", 400);
  const { error } = await admin.client.from("roadmap_items").delete().eq("id", id);
  if (error) return jsonError(error.message);
  return jsonData({ ok: true });
}
