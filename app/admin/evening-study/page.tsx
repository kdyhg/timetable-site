"use client";

import { PageHeader } from "@/components/page-header";
import { adminHeaders, parseApiResponse } from "@/lib/client-api";
import {
  defaultEveningStudyData,
  eveningStudyWeekdays,
  type EveningStudyCode,
  type EveningStudyData,
  type EveningStudySessionCode,
  type EveningStudyStudent,
} from "@/lib/evening-study";
import { getAdminPassword } from "@/lib/notices";
import { AlertTriangle, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const codeOptions: { value: EveningStudyCode; label: string }[] = [
  { value: "", label: "불참" },
  { value: "8", label: "8교시까지" },
  { value: "1", label: "야자 1차시까지" },
  { value: "2", label: "야자 2차시까지" },
];

const emptyStudent = (): EveningStudyStudent => ({
  id: 0,
  classNumber: "",
  maskedName: "",
  monday: "",
  tuesday: "",
  wednesday: "",
  thursday: "",
  friday: "",
});

export default function EveningStudyAdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [data, setData] = useState<EveningStudyData>(defaultEveningStudyData);
  const [students, setStudents] = useState<EveningStudyStudent[]>([]);
  const [newStudent, setNewStudent] = useState<EveningStudyStudent | null>(null);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const next = await parseApiResponse<EveningStudyData>(
      fetch("/api/evening-study", { cache: "no-store" }),
    );
    setData(next);
    setStudents(next.students);
  }, []);

  useEffect(() => {
    const current = getAdminPassword();
    if (!current) {
      router.replace("/admin");
      return;
    }
    setPassword(current);
    load().catch((reason) =>
      setError(reason instanceof Error ? reason.message : "명단을 불러오지 못했습니다."),
    );
  }, [load, router]);

  const updateStudent = (
    id: number,
    key: keyof EveningStudyStudent,
    value: string,
  ) => {
    setStudents((current) =>
      current.map((student) =>
        student.id === id ? { ...student, [key]: value } : student,
      ),
    );
  };

  const saveStudent = async (student: EveningStudyStudent, isNew = false) => {
    setSaving(isNew ? "new" : `student-${student.id}`);
    setError("");
    setMessage("");
    try {
      await parseApiResponse(
        fetch(`/api/evening-study${isNew ? "" : `?id=${student.id}`}`, {
          method: isNew ? "POST" : "PATCH",
          headers: adminHeaders(password),
          body: JSON.stringify(student),
        }),
      );
      await load();
      setNewStudent(null);
      setMessage("명단을 저장했습니다.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "명단을 저장하지 못했습니다.");
    } finally {
      setSaving("");
    }
  };

  const removeStudent = async (student: EveningStudyStudent) => {
    if (!confirm(`${student.classNumber} ${student.maskedName} 학생을 삭제할까요?`)) return;
    setSaving(`student-${student.id}`);
    setError("");
    try {
      await parseApiResponse(
        fetch(`/api/evening-study?id=${student.id}`, {
          method: "DELETE",
          headers: { "x-admin-password": password },
        }),
      );
      await load();
      setMessage("학생을 삭제했습니다.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "학생을 삭제하지 못했습니다.");
    } finally {
      setSaving("");
    }
  };

  const setSessionTime = (
    code: EveningStudySessionCode,
    edge: "start" | "end",
    value: string,
  ) => {
    setData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        sessions: {
          ...current.settings.sessions,
          [code]: { ...current.settings.sessions[code], [edge]: value },
        },
      },
    }));
  };

  const saveSettings = async () => {
    setSaving("settings");
    setError("");
    setMessage("");
    try {
      await parseApiResponse(
        fetch("/api/evening-study", {
          method: "PATCH",
          headers: adminHeaders(password),
          body: JSON.stringify({ kind: "settings", ...data.settings }),
        }),
      );
      await load();
      setMessage("기준일과 차시 시간을 저장했습니다.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "시간 설정을 저장하지 못했습니다.");
    } finally {
      setSaving("");
    }
  };

  const studentEditor = (student: EveningStudyStudent, isNew = false) => (
    <div key={isNew ? "new" : student.id} className="border-b border-[#e6e6e6] p-4 last:border-b-0 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-[100px_1fr_auto] sm:items-end">
        <label className="space-y-1.5 text-xs font-semibold text-[#615d59]">
          <span>번호</span>
          <input
            inputMode="numeric"
            value={student.classNumber}
            onChange={(event) =>
              isNew
                ? setNewStudent({ ...student, classNumber: event.target.value })
                : updateStudent(student.id, "classNumber", event.target.value)
            }
            className="notion-input w-full text-sm font-normal"
            placeholder="03"
          />
        </label>
        <label className="space-y-1.5 text-xs font-semibold text-[#615d59]">
          <span>표시 이름</span>
          <input
            value={student.maskedName}
            onChange={(event) =>
              isNew
                ? setNewStudent({ ...student, maskedName: event.target.value })
                : updateStudent(student.id, "maskedName", event.target.value)
            }
            className="notion-input w-full text-sm font-normal"
            placeholder="이름을 입력하면 자동으로 가립니다"
          />
        </label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => saveStudent(student, isNew)}
            disabled={Boolean(saving)}
            className="notion-button notion-button-primary flex-1 disabled:opacity-50 sm:flex-none"
          >
            <Save className="h-4 w-4" /> 저장
          </button>
          {isNew ? (
            <button type="button" onClick={() => setNewStudent(null)} className="notion-button">
              취소
            </button>
          ) : (
            <button
              type="button"
              onClick={() => removeStudent(student)}
              disabled={Boolean(saving)}
              className="touch-icon-button hover:bg-red-50 hover:text-red-600"
              title="학생 삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {eveningStudyWeekdays.map((weekday) => (
          <label key={weekday.key} className="space-y-1.5 text-xs font-semibold text-[#615d59]">
            <span>{weekday.label}요일</span>
            <select
              value={student[weekday.key]}
              onChange={(event) => {
                const value = event.target.value as EveningStudyCode;
                if (isNew) setNewStudent({ ...student, [weekday.key]: value });
                else updateStudent(student.id, weekday.key, value);
              }}
              className="notion-input w-full text-sm font-normal"
            >
              {codeOptions.map((option) => (
                <option key={option.value || "none"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="야간자율학습 관리"
        description="요일별 기본 명단과 종료 차시, 운영 시간을 수정합니다."
        crumbs={[
          { label: "홈", href: "/" },
          { label: "관리자", href: "/admin" },
          { label: "야간자율학습 관리" },
        ]}
      />

      {data.source === "default" && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            현재 엑셀 기본 명단을 표시하고 있습니다. 저장 기능을 사용하려면 Supabase에서
            <b> 20260828_evening_study.sql</b>을 먼저 실행하세요.
          </p>
        </div>
      )}
      {error && <p className="mb-5 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mb-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

      <section className="mb-8">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">기준일과 차시 시간</h2>
          <p className="mt-1 text-sm text-[#787774]">학생 화면에 표시되는 기준일과 실제 운영 시간을 입력합니다.</p>
        </div>
        <div className="notion-card p-4 sm:p-5">
          <label className="block max-w-xs space-y-1.5 text-sm font-semibold">
            <span>명단 기준일</span>
            <input
              type="date"
              value={data.settings.effectiveDate}
              onChange={(event) =>
                setData((current) => ({
                  ...current,
                  settings: { ...current.settings, effectiveDate: event.target.value },
                }))
              }
              className="notion-input w-full font-normal"
            />
          </label>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {(["8", "1", "2"] as const).map((code) => {
              const session = data.settings.sessions[code];
              return (
                <div key={code} className="border-t border-[#e6e6e6] pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0 first:md:border-l-0 first:md:pl-0">
                  <p className="text-sm font-semibold">{session.label}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label className="space-y-1 text-xs text-[#615d59]">
                      <span>시작</span>
                      <input type="time" value={session.start} onChange={(event) => setSessionTime(code, "start", event.target.value)} className="notion-input w-full text-sm" />
                    </label>
                    <label className="space-y-1 text-xs text-[#615d59]">
                      <span>종료</span>
                      <input type="time" value={session.end} onChange={(event) => setSessionTime(code, "end", event.target.value)} className="notion-input w-full text-sm" />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
          <button type="button" onClick={saveSettings} disabled={Boolean(saving)} className="notion-button notion-button-primary mt-5 w-full disabled:opacity-50 sm:w-auto">
            <Save className="h-4 w-4" /> {saving === "settings" ? "저장 중..." : "시간 설정 저장"}
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">요일별 기본 명단</h2>
            <p className="mt-1 text-sm text-[#787774]">전체 이름을 입력해도 저장할 때 자동으로 마스킹됩니다.</p>
          </div>
          {!newStudent && (
            <button type="button" onClick={() => setNewStudent(emptyStudent())} className="notion-button notion-button-primary shrink-0">
              <Plus className="h-4 w-4" /> 학생 추가
            </button>
          )}
        </div>
        <div className="notion-card overflow-hidden">
          {newStudent && studentEditor(newStudent, true)}
          {students.map((student) => studentEditor(student))}
          {!students.length && !newStudent && (
            <p className="p-8 text-center text-sm text-[#787774]">등록된 학생이 없습니다.</p>
          )}
        </div>
      </section>
    </>
  );
}
