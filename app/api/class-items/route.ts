import { NextRequest } from "next/server";
import { jsonData, jsonError, parseId, requireAdmin } from "@/lib/api-server";
import { classItemTypes } from "@/lib/content";
import {
  cleanText,
  getPublicSupabase,
  nullableText,
} from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const payload = (body: Record<string, unknown>) => ({
  item_type: classItemTypes.includes(body.item_type as never)
    ? body.item_type
    : "시험",
  title: cleanText(body.title),
  subject: nullableText(body.subject),
  date: cleanText(body.date),
  end_date: nullableText(body.end_date),
  scope: nullableText(body.scope),
  preparation: nullableText(body.preparation),
  details: nullableText(body.details),
  link_url: nullableText(body.link_url),
  attachment_url: nullableText(body.attachment_url),
  attachment_name: nullableText(body.attachment_name),
});

export async function GET() {
  const supabase = getPublicSupabase();
  if (!supabase) return jsonError("Supabase 환경 변수가 설정되어 있지 않습니다.");
  const { data, error } = await supabase
    .from("class_items")
    .select("*")
    .order("date", { ascending: true })
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
  if (!item.title || !item.date) return jsonError("제목과 날짜를 입력하세요.", 400);
  const { error } = await admin.client.from("class_items").insert([item]);
  if (error) return jsonError(error.message);
  return jsonData({ ok: true }, 201);
}

export async function PATCH(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin.error) return admin.error;
  const id = parseId(request);
  if (!id) return jsonError("일정 ID가 올바르지 않습니다.", 400);
  const item = payload(
    ((await request.json().catch(() => null)) as Record<string, unknown>) ?? {},
  );
  if (!item.title || !item.date) return jsonError("제목과 날짜를 입력하세요.", 400);
  const { error } = await admin.client.from("class_items").update(item).eq("id", id);
  if (error) return jsonError(error.message);
  return jsonData({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin.error) return admin.error;
  const id = parseId(request);
  if (!id) return jsonError("삭제할 일정 ID가 올바르지 않습니다.", 400);
  const { error } = await admin.client.from("class_items").delete().eq("id", id);
  if (error) return jsonError(error.message);
  return jsonData({ ok: true });
}
