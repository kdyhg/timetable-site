"use client";

import { PageHeader } from "@/components/page-header";
import { validStudentIds } from "@/app/timetable-data";
import { STUDENT_ID_STORAGE_KEY } from "@/lib/student-tools";
import { Download, Search, Smartphone, Tablet } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

type TimetableVersion = "phone" | "tablet";

const timetableVersions = {
  phone: {
    label: "휴대폰용",
    description: "세로 화면에 맞춘 시간표",
    icon: Smartphone,
    width: 1587,
    height: 2245,
  },
  tablet: {
    label: "태블릿·배경화면용",
    description: "배경화면 설정을 위한 여백 포함",
    icon: Tablet,
    width: 5000,
    height: 5000,
  },
} as const;

const timetableVersionEntries = Object.entries(timetableVersions) as [
  TimetableVersion,
  (typeof timetableVersions)[TimetableVersion],
][];

export default function TimetablePage() {
  const [studentId, setStudentId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [version, setVersion] = useState<TimetableVersion>("phone");
  const [error, setError] = useState("");
  const [remembered, setRemembered] = useState(false);

  const selectedVersion = timetableVersions[version];
  const SelectedVersionIcon = selectedVersion.icon;
  const imagePath = selectedStudentId
    ? `/timetables/${version}/${selectedStudentId}.png`
    : "";

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const saved = window.localStorage.getItem(STUDENT_ID_STORAGE_KEY);
      if (saved && validStudentIds.includes(saved)) {
        setStudentId(saved);
        setSelectedStudentId(saved);
        setRemembered(true);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const search = () => {
    const id = studentId.trim();
    if (!validStudentIds.includes(id)) {
      setError("현재 2학년 10반 학생의 학번 5자리를 입력하세요.");
      setSelectedStudentId("");
      return;
    }
    setError("");
    setSelectedStudentId(id);
    window.localStorage.setItem(STUDENT_ID_STORAGE_KEY, id);
    setRemembered(true);
  };

  return (
    <>
      <PageHeader
        title="시간표"
        description="학번을 입력하고 휴대폰용 또는 태블릿용 2학기 시간표를 내려받으세요."
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
              maxLength={5}
              autoComplete="off"
            />
            <button type="button" onClick={search} className="notion-button notion-button-primary">
              <Search className="h-4 w-4" /> 조회
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {remembered && !error && (
            <p className="mt-3 text-sm text-emerald-700">
              이 기기에 학번을 기억했습니다. 다음 방문에도 바로 표시됩니다.
            </p>
          )}
        </div>
        {imagePath && (
          <section className="mt-5 space-y-4">
            <div className="notion-card p-3 sm:p-4">
              <p className="px-1 pb-3 text-sm font-semibold">미리보기 선택</p>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="시간표 이미지 버전">
                {timetableVersionEntries.map(
                  ([key, item]) => {
                    const Icon = item.icon;
                    const active = version === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setVersion(key)}
                        aria-pressed={active}
                        className={`flex min-h-20 items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                          active
                            ? "border-[#0075de] bg-[#eef7ff] text-[#005bab]"
                            : "border-[#e6e6e6] bg-white hover:bg-[#f6f5f4]"
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{item.label}</span>
                          <span className="mt-0.5 hidden text-xs leading-5 text-[#787774] sm:block">
                            {item.description}
                          </span>
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {timetableVersionEntries.map(
                  ([key, item]) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={key}
                        href={`/timetables/${key}/${selectedStudentId}.png`}
                        download={`${selectedStudentId}-${item.label}-시간표.png`}
                        className={`notion-button w-full ${key === version ? "notion-button-primary" : ""}`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label} 다운로드
                        <Download className="h-4 w-4" />
                      </a>
                    );
                  },
                )}
              </div>
            </div>

            <div className="notion-card overflow-hidden p-3">
              <div className="flex items-center justify-between gap-3 px-1 pb-3">
                <div>
                  <p className="text-sm font-semibold">{selectedStudentId} 시간표</p>
                  <p className="mt-0.5 text-xs text-[#787774]">{selectedVersion.label} 미리보기</p>
                </div>
                <SelectedVersionIcon className="h-5 w-5 shrink-0 text-[#787774]" aria-hidden="true" />
              </div>
              <Image
                src={imagePath}
                alt={`${selectedStudentId} ${selectedVersion.label} 2학기 시간표`}
                width={selectedVersion.width}
                height={selectedVersion.height}
                className="h-auto w-full rounded-lg border border-[#e6e6e6]"
                priority
                onError={() => {
                  setError("해당 학번의 시간표 이미지를 찾을 수 없습니다.");
                  setSelectedStudentId("");
                }}
              />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
