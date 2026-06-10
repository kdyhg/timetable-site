"use client";

import { PageHeader } from "@/components/page-header";
import {
  studentTimetables,
  timetableTemplatePath,
} from "@/app/timetable-data";
import { STUDENT_ID_STORAGE_KEY } from "@/lib/student-tools";
import { Download, FileSpreadsheet, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function TimetablePage() {
  const [studentId, setStudentId] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [error, setError] = useState("");
  const [remembered, setRemembered] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const saved = window.localStorage.getItem(STUDENT_ID_STORAGE_KEY);
      if (saved && studentTimetables[saved]) {
        setStudentId(saved);
        setImagePath(`/timetables/${saved}.png`);
        setRemembered(true);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const search = () => {
    const id = studentId.trim();
    if (!studentTimetables[id]) {
      setError("2학년 10반 학번 5자리를 입력하세요.");
      setImagePath("");
      return;
    }
    setError("");
    setImagePath(`/timetables/${id}.png`);
    window.localStorage.setItem(STUDENT_ID_STORAGE_KEY, id);
    setRemembered(true);
  };

  return (
    <>
      <PageHeader
        title="시간표"
        description="학번을 한 번 조회하면 이 기기에만 기억하여 홈에서 현재 교시를 안내합니다."
        crumbs={[{ label: "홈", href: "/" }, { label: "학교생활" }, { label: "시간표" }]}
      />
      <div className="mx-auto max-w-2xl">
        <div className="notion-card p-5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && search()}
              className="notion-input flex-1"
              placeholder="예: 21010"
              inputMode="numeric"
            />
            <button type="button" onClick={search} className="notion-button notion-button-primary">
              <Search className="h-4 w-4" /> 조회
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {remembered && !error && (
            <p className="mt-3 text-sm text-emerald-700">
              이 기기에 학번을 기억했습니다. 서버에는 저장하지 않습니다.
            </p>
          )}
        </div>
        <div className="notion-card mt-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <FileSpreadsheet className="h-4 w-4 text-[#0075de]" />
              과목 데이터 입력 양식
            </p>
            <p className="mt-2 text-xs leading-5 text-[#787774]">
              과목명 연결 전까지 홈의 현재 교시는 교시와 남은 시간만 표시됩니다.
            </p>
          </div>
          <a href={timetableTemplatePath} download className="notion-button shrink-0">
            <Download className="h-4 w-4" /> 엑셀 양식
          </a>
        </div>
        {imagePath && (
          <div className="notion-card mt-5 overflow-hidden p-3">
            <Image
              src={imagePath}
              alt="학생 시간표"
              width={900}
              height={1273}
              className="h-auto w-full rounded-lg"
              onError={() => {
                setError("해당 학번의 시간표 이미지를 찾을 수 없습니다.");
                setImagePath("");
              }}
            />
            <a href={imagePath} download className="notion-button mt-3 w-full">
              <Download className="h-4 w-4" /> 이미지 다운로드
            </a>
          </div>
        )}
      </div>
    </>
  );
}
