"use client";

import { PageHeader } from "@/components/page-header";
import { Download, Search } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function TimetablePage() {
  const [studentId, setStudentId] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [error, setError] = useState("");

  const search = () => {
    if (!/^\d{5}$/.test(studentId.trim())) {
      setError("학번 5자리를 입력하세요.");
      setImagePath("");
      return;
    }
    setError("");
    setImagePath(`/timetables/${studentId.trim()}.png`);
  };

  return (
    <>
      <PageHeader
        title="시간표"
        description="학번 5자리를 입력해 개인 시간표를 확인할 수 있습니다."
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
