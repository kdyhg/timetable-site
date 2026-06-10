import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, isAdminRequest } from "@/lib/supabase-server";

export const jsonError = (message: string, status = 500) =>
  NextResponse.json({ error: message }, { status });

export const jsonData = <T>(data: T, status = 200) =>
  NextResponse.json({ data }, { status });

export function requireAdmin(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return { error: jsonError("관리자 인증이 필요합니다.", 401), client: null };
  }
  const client = getAdminSupabase();
  if (!client) {
    return {
      error: jsonError(
        "SUPABASE_SECRET_KEY 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다.",
        503,
      ),
      client: null,
    };
  }
  return { error: null, client };
}

export const parseId = (request: NextRequest) => {
  const id = Number(request.nextUrl.searchParams.get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
};
