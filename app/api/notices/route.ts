import { NextRequest } from "next/server";
import { jsonData, jsonError, parseId, requireAdmin } from "@/lib/api-server";
import { noticeCategories } from "@/lib/content";
import {
  cleanText,
  getPublicSupabase,
  nullableText,
} from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const payload = (body: Record<string, unknown>) => {
  const title = cleanText(body.title);
  const content = cleanText(body.content);
  const category = noticeCategories.includes(body.category as never)
    ? body.category
    : body.is_important === true
      ? "중요"
      : "일반";
  return {
    title,
    content,
    category,
    is_important: body.is_important === true || category === "중요",
    due_date: nullableText(body.due_date),
    publish_start: nullableText(body.publish_start),
    publish_end: nullableText(body.publish_end),
    link_url: nullableText(body.link_url),
    attachment_url: nullableText(body.attachment_url),
    attachment_name: nullableText(body.attachment_name),
  };
};

export async function GET() {
  const supabase = getPublicSupabase();
  if (!supabase) return jsonError("Supabase 환경 변수가 설정되어 있지 않습니다.");
  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .order("is_important", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return jsonError(error.message);
  return jsonData(
    (data ?? []).map((notice) => ({
      ...notice,
      category: notice.category || (notice.is_important ? "중요" : "일반"),
      due_date: notice.due_date ?? null,
      publish_start: notice.publish_start ?? null,
      publish_end: notice.publish_end ?? null,
      link_url: notice.link_url ?? null,
      attachment_url: notice.attachment_url ?? null,
      attachment_name: notice.attachment_name ?? null,
    })),
  );
}
export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin.error) return admin.error;
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const notice = payload(body ?? {});
  if (!notice.title || !notice.content) {
    return jsonError("제목과 내용을 입력하세요.", 400);
  }
  const { error } = await admin.client.from("notices").insert([notice]);
  if (error) return jsonError(error.message);
  return jsonData({ ok: true }, 201);
}

export async function PATCH(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin.error) return admin.error;
  const id = parseId(request);
  if (!id) return jsonError("공지 ID가 올바르지 않습니다.", 400);
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const notice = payload(body ?? {});
  if (!notice.title || !notice.content) {
    return jsonError("제목과 내용을 입력하세요.", 400);
  }
  const { error } = await admin.client.from("notices").update(notice).eq("id", id);
  if (error) return jsonError(error.message);
  return jsonData({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin.error) return admin.error;
  const id = parseId(request);
  if (!id) return jsonError("삭제할 공지 ID가 올바르지 않습니다.", 400);
  const { error } = await admin.client.from("notices").delete().eq("id", id);
  if (error) return jsonError(error.message);
  return jsonData({ ok: true });
}
