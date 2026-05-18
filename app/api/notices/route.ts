import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type NoticePayload = {
  title?: unknown;
  content?: unknown;
  is_important?: unknown;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const adminPassword =
  process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "5314";

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const jsonError = (message: string, status = 500) =>
  NextResponse.json({ error: message }, { status });

const isAdminRequest = (request: NextRequest) =>
  request.headers.get("x-admin-password") === adminPassword;

export async function GET() {
  if (!supabase) {
    return jsonError("Supabase 환경 변수가 설정되어 있지 않습니다.");
  }

  try {
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("is_important", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ notices: data ?? [] });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "공지사항을 불러오지 못했습니다.",
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return jsonError("관리자 인증이 필요합니다.", 401);
  }

  if (!supabase) {
    return jsonError("Supabase 환경 변수가 설정되어 있지 않습니다.");
  }

  const body = (await request.json().catch(() => null)) as NoticePayload | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const isImportant = body?.is_important === true;

  if (!title || !content) {
    return jsonError("제목과 내용을 입력하세요.", 400);
  }

  try {
    const { error } = await supabase
      .from("notices")
      .insert([{ title, content, is_important: isImportant }]);

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "공지사항 저장에 실패했습니다.",
      500,
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return jsonError("관리자 인증이 필요합니다.", 401);
  }

  if (!supabase) {
    return jsonError("Supabase 환경 변수가 설정되어 있지 않습니다.");
  }

  const id = Number(request.nextUrl.searchParams.get("id"));

  if (!Number.isInteger(id)) {
    return jsonError("삭제할 공지 ID가 올바르지 않습니다.", 400);
  }

  try {
    const { error } = await supabase.from("notices").delete().eq("id", id);

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "공지사항 삭제에 실패했습니다.",
      500,
    );
  }
}
