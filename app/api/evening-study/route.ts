import { NextRequest } from "next/server";
import { jsonData, jsonError, parseId, requireAdmin } from "@/lib/api-server";
import {
  defaultEveningStudyData,
  eveningStudyWeekdays,
  maskStudentName,
  normalizeClassNumber,
  normalizeEveningStudyCode,
  type EveningStudyData,
  type EveningStudySessionCode,
  type EveningStudyStudent,
} from "@/lib/evening-study";
import { cleanText, getPublicSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type StudentRow = {
  id: number;
  class_number: string;
  masked_name: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
};

type SettingsRow = {
  effective_date: string;
  session_8_start: string;
  session_8_end: string;
  session_1_start: string;
  session_1_end: string;
  session_2_start: string;
  session_2_end: string;
  updated_at: string;
};

const trimTime = (value: unknown, fallback: string) => {
  const text = cleanText(value).slice(0, 5);
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : fallback;
};

const mapStudent = (row: StudentRow): EveningStudyStudent => ({
  id: row.id,
  classNumber: row.class_number,
  maskedName: row.masked_name,
  monday: normalizeEveningStudyCode(row.monday),
  tuesday: normalizeEveningStudyCode(row.tuesday),
  wednesday: normalizeEveningStudyCode(row.wednesday),
  thursday: normalizeEveningStudyCode(row.thursday),
  friday: normalizeEveningStudyCode(row.friday),
});

const mapData = (settings: SettingsRow, rows: StudentRow[]): EveningStudyData => ({
  source: "database",
  settings: {
    effectiveDate: settings.effective_date,
    updatedAt: settings.updated_at,
    sessions: {
      "8": { code: "8", label: "8교시까지", start: settings.session_8_start.slice(0, 5), end: settings.session_8_end.slice(0, 5) },
      "1": { code: "1", label: "야자 1차시까지", start: settings.session_1_start.slice(0, 5), end: settings.session_1_end.slice(0, 5) },
      "2": { code: "2", label: "야자 2차시까지", start: settings.session_2_start.slice(0, 5), end: settings.session_2_end.slice(0, 5) },
    },
  },
  students: rows.map(mapStudent),
});

const studentPayload = (body: Record<string, unknown>) => {
  const classNumber = normalizeClassNumber(body.classNumber);
  const maskedName = maskStudentName(body.maskedName ?? body.name);
  return {
    class_number: classNumber,
    masked_name: maskedName,
    ...Object.fromEntries(
      eveningStudyWeekdays.map(({ key }) => [
        key,
        normalizeEveningStudyCode(body[key]),
      ]),
    ),
    updated_at: new Date().toISOString(),
  };
};

export async function GET() {
  const supabase = getPublicSupabase();
  if (!supabase) return jsonData(defaultEveningStudyData);

  const [settingsResult, studentsResult] = await Promise.all([
    supabase.from("evening_study_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("evening_study_students").select("*").order("class_number"),
  ]);

  if (
    settingsResult.error ||
    studentsResult.error ||
    !settingsResult.data ||
    !studentsResult.data
  ) {
    return jsonData(defaultEveningStudyData);
  }

  return jsonData(
    mapData(
      settingsResult.data as SettingsRow,
      studentsResult.data as StudentRow[],
    ),
  );
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin.error) return admin.error;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const student = studentPayload(body ?? {});
  if (!student.class_number || !student.masked_name) {
    return jsonError("번호와 이름을 입력하세요.", 400);
  }
  const { error } = await admin.client.from("evening_study_students").insert(student);
  if (error) return jsonError(error.message);
  return jsonData({ ok: true }, 201);
}

export async function PATCH(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin.error) return admin.error;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return jsonError("저장할 내용이 없습니다.", 400);

  if (body.kind === "settings") {
    const effectiveDate = cleanText(body.effectiveDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
      return jsonError("명단 기준일을 입력하세요.", 400);
    }
    const sessions = (body.sessions ?? {}) as Record<string, Record<string, unknown>>;
    const defaults = defaultEveningStudyData.settings.sessions;
    const time = (code: EveningStudySessionCode, edge: "start" | "end") =>
      trimTime(sessions[code]?.[edge], defaults[code][edge]);
    const { error } = await admin.client
      .from("evening_study_settings")
      .upsert({
        id: 1,
        effective_date: effectiveDate,
        session_8_start: time("8", "start"),
        session_8_end: time("8", "end"),
        session_1_start: time("1", "start"),
        session_1_end: time("1", "end"),
        session_2_start: time("2", "start"),
        session_2_end: time("2", "end"),
        updated_at: new Date().toISOString(),
      });
    if (error) return jsonError(error.message);
    return jsonData({ ok: true });
  }

  const id = parseId(request);
  if (!id) return jsonError("학생 ID가 올바르지 않습니다.", 400);
  const student = studentPayload(body);
  if (!student.class_number || !student.masked_name) {
    return jsonError("번호와 이름을 입력하세요.", 400);
  }
  const { error } = await admin.client
    .from("evening_study_students")
    .update(student)
    .eq("id", id);
  if (error) return jsonError(error.message);
  return jsonData({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin.error) return admin.error;
  const id = parseId(request);
  if (!id) return jsonError("삭제할 학생 ID가 올바르지 않습니다.", 400);
  const { error } = await admin.client
    .from("evening_study_students")
    .delete()
    .eq("id", id);
  if (error) return jsonError(error.message);
  return jsonData({ ok: true });
}
