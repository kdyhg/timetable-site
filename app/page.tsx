"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  admissionDocuments,
  admissionRegionFilters,
  type AdmissionDocument,
  type AdmissionRegionFilter,
} from "./admissions-data";
import { medicalAdmissionsWorkbook } from "./career-data";

const OFFICE_CODE = process.env.NEXT_PUBLIC_OFFICE_CODE || "C10";
const SCHOOL_CODE = process.env.NEXT_PUBLIC_SCHOOL_CODE || "7150404";
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "5314";

type Meal = { type: string; menu: string };
type MealApiRow = { MMEAL_SC_NM: string; DDISH_NM: string };
type MealApiResponse = {
  mealServiceDietInfo?: [unknown, { row: MealApiRow[] }];
};
type Notice = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  is_important: boolean;
};
type NoticesApiResponse = {
  notices?: Notice[];
  error?: string;
};
type MedicalDisplayMode = "summary" | "table";
type MedicalAdmissionType = "all" | "교과" | "학종" | "정시";
type MedicalCsatFilter = "all" | "with" | "none";
type MedicalRecord = {
  key: string;
  sheetName: string;
  region: string;
  university: string;
  curriculumCount: string;
  curriculumMethod: string;
  curriculumCsatArea: string;
  curriculumCsatCondition: string;
  schoolRecordCount: string;
  schoolRecordMethod: string;
  schoolRecordCsatArea: string;
  schoolRecordCsatCondition: string;
  regularGa: string;
  regularNa: string;
  regularDa: string;
  regularMethod: string;
  regularIndicator: string;
  regularKorean: string;
  regularEnglish: string;
  regularMath: string;
  regularSocial: string;
  regularScience: string;
  regularCountText: string;
  csatSummary: string;
  searchText: string;
};
type ViewType =
  | "home"
  | "timetable"
  | "notice-list"
  | "admin"
  | "career"
  | "meal-board"
  | "medical-admissions"
  | "notice-write"
  | "admissions";

const mealCache = new Map<string, Meal[]>();
const medicalCareerSheetNames = ["의예", "치의예", "약학", "한의예", "수의예"];
const defaultMedicalSheetName = medicalCareerSheetNames[0];
const medicalAdmissionTypeFilters: {
  id: MedicalAdmissionType;
  label: string;
}[] = [
  { id: "all", label: "전체" },
  { id: "교과", label: "교과" },
  { id: "학종", label: "학종" },
  { id: "정시", label: "정시" },
];
const medicalCsatFilters: { id: MedicalCsatFilter; label: string }[] = [
  { id: "all", label: "최저 전체" },
  { id: "with", label: "최저 있음" },
  { id: "none", label: "최저 없음" },
];

const hasMedicalValue = (value: string) => {
  const trimmed = value.trim();

  return Boolean(trimmed) && !/^(미선발|-|없음)$/.test(trimmed);
};

const displayMedicalValue = (value: string) =>
  hasMedicalValue(value) ? value.trim() : "-";

const compactMedicalValue = (value: string) =>
  displayMedicalValue(value).replace(/\n/g, " / ");

const joinMedicalParts = (parts: string[]) =>
  parts.filter(hasMedicalValue).map(compactMedicalValue).join(" / ");

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const cleanMealMenu = (menu: string) =>
  menu.replace(/[0-9.]/g, "").replace(/<br\/?>/g, ", ");

const parseNoticeResponse = async (response: Response) => {
  const body = (await response.json().catch(() => ({}))) as NoticesApiResponse;

  if (!response.ok) {
    throw new Error(body.error || `HTTP ${response.status}`);
  }

  return body;
};

const HomeCard = ({
  label,
  title,
  subtitle,
  color,
  onClick,
}: {
  label: string;
  title: string;
  subtitle: string;
  color: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="cursor-pointer bg-white border-4 border-black p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex flex-col items-center text-center min-h-[178px]"
  >
    <span
      className={`mb-4 flex h-16 w-16 items-center justify-center border-4 border-black text-xl font-black ${color}`}
      aria-hidden="true"
    >
      {label}
    </span>
    <span className="text-xl font-black mb-2 underline">{title}</span>
    <span className="font-bold text-gray-500 text-xs italic">{subtitle}</span>
  </button>
);

export default function RetroDashboard() {
  const [view, setView] = useState<ViewType>("home");
  const [prevView, setPrevView] = useState<ViewType>("home");

  const [studentId, setStudentId] = useState("");
  const [viewPath, setViewPath] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminSessionPassword, setAdminSessionPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [, setClickCount] = useState(0);

  const [notices, setNotices] = useState<Notice[]>([]);
  const [meal, setMeal] = useState<string>("오늘의 급식을 불러오는 중...");
  const [loading, setLoading] = useState(true);
  const [isImportant, setIsImportant] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeError, setNoticeError] = useState("");
  const [isNoticeSaving, setIsNoticeSaving] = useState(false);

  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [dailyMeals, setDailyMeals] = useState<Meal[]>([]);
  const [isMealLoading, setIsMealLoading] = useState(false);

  const [admissionRegion, setAdmissionRegion] =
    useState<AdmissionRegionFilter>("all");
  const [admissionQuery, setAdmissionQuery] = useState("");
  const [selectedAdmission, setSelectedAdmission] =
    useState<AdmissionDocument>(admissionDocuments[0]);
  const [selectedMedicalSheetName, setSelectedMedicalSheetName] = useState(
    defaultMedicalSheetName,
  );
  const [medicalDisplayMode, setMedicalDisplayMode] =
    useState<MedicalDisplayMode>("summary");
  const [medicalQuery, setMedicalQuery] = useState("");
  const [medicalRegion, setMedicalRegion] = useState("all");
  const [medicalAdmissionType, setMedicalAdmissionType] =
    useState<MedicalAdmissionType>("all");
  const [medicalCsatFilter, setMedicalCsatFilter] =
    useState<MedicalCsatFilter>("all");
  const [expandedMedicalRecordKey, setExpandedMedicalRecordKey] = useState<
    string | null
  >(null);

  const filteredAdmissions = useMemo(() => {
    const query = admissionQuery.trim().toLowerCase();

    return admissionDocuments.filter((document) => {
      const regionMatches =
        admissionRegion === "all" || document.region === admissionRegion;
      const queryMatches =
        !query || document.university.toLowerCase().includes(query);

      return regionMatches && queryMatches;
    });
  }, [admissionQuery, admissionRegion]);

  const activeAdmission =
    filteredAdmissions.find((document) => document.id === selectedAdmission.id) ||
    filteredAdmissions[0];
  const activeMedicalSheet =
    medicalAdmissionsWorkbook.sheets.find(
      (sheet) => sheet.name === selectedMedicalSheetName,
    ) ?? medicalAdmissionsWorkbook.sheets[0];
  const medicalColumnMetas = useMemo(() => {
    if (!activeMedicalSheet) {
      return [];
    }

    const headerRows = activeMedicalSheet.rows.slice(
      0,
      activeMedicalSheet.headerRowCount,
    );
    const columnCount = Math.max(
      0,
      ...activeMedicalSheet.rows.map((row) => row.length),
    );

    return Array.from({ length: columnCount }, (_, columnIndex) => {
      const headerText = headerRows
        .map((row) => row[columnIndex]?.trim())
        .filter(Boolean)
        .join(" ");

      return {
        index: columnIndex,
        headerText,
        isDetailColumn: /특징|조건|평가요소|수능최저|전형방법/.test(
          headerText,
        ),
        isUniversityColumn: /대학/.test(headerText),
      };
    }).filter((meta) => meta.headerText !== "순번");
  }, [activeMedicalSheet]);
  const visibleMedicalSheets =
    medicalDisplayMode === "summary"
      ? medicalAdmissionsWorkbook.sheets.filter((sheet) =>
          medicalCareerSheetNames.includes(sheet.name),
        )
      : medicalAdmissionsWorkbook.sheets;
  const medicalRecords = useMemo<MedicalRecord[]>(() => {
    if (
      !activeMedicalSheet ||
      !medicalCareerSheetNames.includes(activeMedicalSheet.name)
    ) {
      return [];
    }

    return activeMedicalSheet.rows
      .slice(activeMedicalSheet.headerRowCount)
      .map((row, rowIndex) => {
        const regularCountText =
          [
            ["가", row[10] ?? ""],
            ["나", row[11] ?? ""],
            ["다", row[12] ?? ""],
          ]
            .filter(([, value]) => hasMedicalValue(value))
            .map(([group, value]) => `${group} ${compactMedicalValue(value)}`)
            .join(" / ") || "-";
        const csatSummary =
          joinMedicalParts([
            row[4] ?? "",
            row[5] ?? "",
            row[8] ?? "",
            row[9] ?? "",
          ]) || "최저 정보 없음";

        return {
          key: `${activeMedicalSheet.name}-${rowIndex}-${row[1] ?? ""}`,
          sheetName: activeMedicalSheet.name,
          region: row[0] ?? "",
          university: row[1] ?? "",
          curriculumCount: row[2] ?? "",
          curriculumMethod: row[3] ?? "",
          curriculumCsatArea: row[4] ?? "",
          curriculumCsatCondition: row[5] ?? "",
          schoolRecordCount: row[6] ?? "",
          schoolRecordMethod: row[7] ?? "",
          schoolRecordCsatArea: row[8] ?? "",
          schoolRecordCsatCondition: row[9] ?? "",
          regularGa: row[10] ?? "",
          regularNa: row[11] ?? "",
          regularDa: row[12] ?? "",
          regularMethod: row[13] ?? "",
          regularIndicator: row[14] ?? "",
          regularKorean: row[15] ?? "",
          regularEnglish: row[16] ?? "",
          regularMath: row[17] ?? "",
          regularSocial: row[18] ?? "",
          regularScience: row[19] ?? "",
          regularCountText,
          csatSummary,
          searchText: row.join(" "),
        };
      })
      .filter((record) => hasMedicalValue(record.university));
  }, [activeMedicalSheet]);
  const medicalRegionFilters = useMemo(
    () =>
      Array.from(new Set(medicalRecords.map((record) => record.region)))
        .filter(hasMedicalValue)
        .sort((a, b) => a.localeCompare(b, "ko")),
    [medicalRecords],
  );
  const filteredMedicalRecords = useMemo(() => {
    const query = medicalQuery.trim().toLowerCase();

    return medicalRecords.filter((record) => {
      const queryMatches =
        !query || record.searchText.toLowerCase().includes(query);
      const regionMatches =
        medicalRegion === "all" || record.region === medicalRegion;
      const typeMatches =
        medicalAdmissionType === "all" ||
        (medicalAdmissionType === "교과" &&
          hasMedicalValue(record.curriculumCount)) ||
        (medicalAdmissionType === "학종" &&
          hasMedicalValue(record.schoolRecordCount)) ||
        (medicalAdmissionType === "정시" &&
          hasMedicalValue(record.regularCountText));
      const hasCsatMinimum = [
        record.curriculumCsatArea,
        record.curriculumCsatCondition,
        record.schoolRecordCsatArea,
        record.schoolRecordCsatCondition,
      ].some(hasMedicalValue);
      const csatMatches =
        medicalCsatFilter === "all" ||
        (medicalCsatFilter === "with" && hasCsatMinimum) ||
        (medicalCsatFilter === "none" && !hasCsatMinimum);

      return queryMatches && regionMatches && typeMatches && csatMatches;
    });
  }, [
    medicalAdmissionType,
    medicalCsatFilter,
    medicalQuery,
    medicalRecords,
    medicalRegion,
  ]);

  const fetchMeal = useCallback(async () => {
    try {
      const today = getLocalDateString().replace(/-/g, "");
      const res = await fetch(
        `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${today}`,
      );
      const data = (await res.json()) as MealApiResponse;

      if (data.mealServiceDietInfo) {
        setMeal(cleanMealMenu(data.mealServiceDietInfo[1].row[0].DDISH_NM));
      } else {
        setMeal("오늘은 급식 정보가 없습니다. (주말/공휴일)");
      }
    } catch {
      setMeal("급식 정보를 불러오지 못했습니다.");
    }
  }, []);

  const fetchDailyMeals = async (dateStr: string) => {
    const formattedDate = dateStr.replace(/-/g, "");

    if (mealCache.has(formattedDate)) {
      setDailyMeals(mealCache.get(formattedDate) || []);
      return;
    }

    setIsMealLoading(true);
    setDailyMeals([]);

    try {
      const res = await fetch(
        `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=${OFFICE_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_YMD=${formattedDate}`,
      );
      const data = (await res.json()) as MealApiResponse;

      const mealsToCache: Meal[] = data.mealServiceDietInfo
        ? data.mealServiceDietInfo[1].row.map((row) => ({
            type: row.MMEAL_SC_NM,
            menu: cleanMealMenu(row.DDISH_NM),
          }))
        : [
            {
              type: "INFO",
              menu: "해당 날짜의 급식 정보가 없습니다.",
            },
          ];

      mealCache.set(formattedDate, mealsToCache);
      setDailyMeals(mealsToCache);
    } catch {
      setDailyMeals([
        {
          type: "ERROR",
          menu: "급식 데이터를 불러오는 중 오류가 발생했습니다.",
        },
      ]);
    } finally {
      setIsMealLoading(false);
    }
  };

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setNoticeError("");

    try {
      const response = await fetch("/api/notices", { cache: "no-store" });
      const body = await parseNoticeResponse(response);

      setNotices(body.notices ?? []);
    } catch (error) {
      setNoticeError(
        `공지사항을 불러오지 못했습니다. ${
          error instanceof Error ? error.message : "네트워크 연결을 확인하세요."
        }`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeal();
    fetchNotices();
  }, [fetchMeal, fetchNotices]);

  const saveNotice = async (title: string, content: string) => {
    setIsNoticeSaving(true);
    setNoticeError("");

    try {
      const response = await fetch("/api/notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminSessionPassword,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          is_important: isImportant,
        }),
      });

      await parseNoticeResponse(response);

      await fetchNotices();
      setNoticeTitle("");
      setNoticeContent("");
      setView("notice-list");
      setIsImportant(false);
    } catch (error) {
      setNoticeError(
        `공지사항 저장에 실패했습니다. ${
          error instanceof Error ? error.message : "네트워크 연결을 확인하세요."
        }`,
      );
    } finally {
      setIsNoticeSaving(false);
    }
  };

  const deleteNotice = async (id: number) => {
    if (confirm("삭제할까요?")) {
      setNoticeError("");
      const response = await fetch(`/api/notices?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": adminSessionPassword,
        },
      });

      await parseNoticeResponse(response);

      await fetchNotices();
    }
  };

  const resetView = () => {
    setView("home");
    setViewPath("");
    setStudentId("");
    setNoticeError("");
    setClickCount(0);
  };

  const openAdmissions = () => {
    setAdmissionRegion("all");
    setAdmissionQuery("");
    setSelectedAdmission(admissionDocuments[0]);
    setView("admissions");
  };

  const openMedicalAdmissions = () => {
    setSelectedMedicalSheetName(defaultMedicalSheetName);
    setMedicalDisplayMode("summary");
    setMedicalQuery("");
    setMedicalRegion("all");
    setMedicalAdmissionType("all");
    setMedicalCsatFilter("all");
    setExpandedMedicalRecordKey(null);
    setView("medical-admissions");
  };

  const handleAdminTrigger = () => {
    setClickCount((prev) => {
      if (prev + 1 >= 5) {
        setPrevView(view);
        setView("admin");
        return 0;
      }
      return prev + 1;
    });
  };

  return (
    <div className="min-h-screen bg-[#f0e7db] text-[#222] font-mono p-4 md:p-8">
      <div className="max-w-5xl mx-auto mb-6 bg-black text-[#00ff41] p-2 border-4 border-gray-600 overflow-hidden shadow-inner">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-sm font-bold uppercase">
            [TODAY&apos;S LUNCH MENU]: {meal} --- [TODAY&apos;S LUNCH MENU]:{" "}
            {meal}
          </span>
        </div>
      </div>

      <header className="max-w-5xl mx-auto border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10 p-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <h1
          className="text-xl md:text-2xl font-black uppercase cursor-pointer"
          onClick={resetView}
        >
          2026 해강고 2학년 10반
        </h1>
        <div className="bg-yellow-300 border-2 border-black px-3 py-1 font-bold text-xs flex w-fit items-center gap-2">
          SYSTEM_ONLINE
          {isAdminAuthenticated && (
            <span className="bg-red-500 text-white px-1 text-[10px]">
              ADMIN
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        {view === "home" ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <HomeCard
              label="TIME"
              title="시간표 조회"
              subtitle="GET TIMETABLE"
              color="bg-blue-500 text-white"
              onClick={() => setView("timetable")}
            />
            <HomeCard
              label="NEWS"
              title="학급 공지사항"
              subtitle="CLASS UPDATES"
              color="bg-yellow-300 text-black"
              onClick={() => {
                setView("notice-list");
                fetchNotices();
              }}
            />
            <HomeCard
              label="MEAL"
              title="급식 조회"
              subtitle="CHECK ALL MEALS"
              color="bg-[#00ff41] text-black"
              onClick={() => {
                setView("meal-board");
                fetchDailyMeals(selectedDate);
              }}
            />
            <HomeCard
              label="2028"
              title="2028 진로진학"
              subtitle="CAREER GUIDE"
              color="bg-red-500 text-white"
              onClick={() => setView("career")}
            />
          </section>
        ) : view === "career" ? (
          <section className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-red-500 text-white px-4 py-2 border-b-4 border-black flex justify-between font-bold text-xs">
              <span>CAREER_2028.EXE</span>
              <button type="button" onClick={resetView}>
                X
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-6">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-black text-gray-500">
                  2028학년도 진로진학 자료실
                </p>
                <h2 className="text-2xl md:text-3xl font-black">
                  2028 진로진학
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <button
                  type="button"
                  onClick={openAdmissions}
                  className="border-4 border-black bg-yellow-50 p-5 text-left shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                >
                  <span className="mb-4 flex h-12 w-12 items-center justify-center border-4 border-black bg-red-500 text-sm font-black text-white">
                    PDF
                  </span>
                  <span className="block text-xl font-black underline">
                    2028 대입전형
                  </span>
                  <span className="mt-2 block text-sm font-bold text-gray-500">
                    대학별 대입전형 시행계획
                  </span>
                </button>

                <button
                  type="button"
                  onClick={openMedicalAdmissions}
                  className="border-4 border-black bg-[#f8f8f8] p-5 text-left shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                >
                  <span className="mb-4 flex h-12 w-12 items-center justify-center border-4 border-black bg-[#00ff41] text-sm font-black text-black">
                    XLSX
                  </span>
                  <span className="block text-xl font-black underline">
                    의약학계열 전형 정리
                  </span>
                  <span className="mt-2 block text-sm font-bold text-gray-500">
                    교과, 학종, 정시, 의약학계열 표
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={resetView}
                className="w-full bg-black text-white py-3 font-bold border-4 border-black hover:bg-gray-800"
              >
                BACK_TO_HOME
              </button>
            </div>
          </section>
        ) : view === "admissions" ? (
          <section className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-red-500 text-white px-4 py-2 border-b-4 border-black flex justify-between font-bold text-xs">
              <span>ADMISSIONS_2028.PDF</span>
              <button type="button" onClick={() => setView("career")}>
                X
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black text-gray-500">
                    2028학년도 대학별 대입전형 시행계획
                  </p>
                  <h2 className="text-2xl md:text-3xl font-black">
                    서울 · 부산 대학 자료실
                  </h2>
                </div>
                <div className="border-4 border-black bg-yellow-300 px-4 py-2 text-sm font-black">
                  TOTAL {admissionDocuments.length}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
                <aside className="space-y-4">
                  <input
                    type="search"
                    value={admissionQuery}
                    onChange={(event) => setAdmissionQuery(event.target.value)}
                    className="w-full border-4 border-black p-3 font-bold"
                    placeholder="대학명 검색"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    {admissionRegionFilters.map((filter) => (
                      <button
                        type="button"
                        key={filter.id}
                        onClick={() => setAdmissionRegion(filter.id)}
                        className={`border-4 border-black py-2 text-sm font-black ${
                          admissionRegion === filter.id
                            ? "bg-black text-white"
                            : "bg-white text-black hover:bg-gray-100"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  <div className="border-4 border-black">
                    <div className="bg-black text-white px-3 py-2 text-xs font-bold">
                      LIST {filteredAdmissions.length}
                    </div>
                    <div className="max-h-[460px] overflow-y-auto bg-[#f8f8f8]">
                      {filteredAdmissions.length > 0 ? (
                        filteredAdmissions.map((document) => (
                          <button
                            type="button"
                            key={document.id}
                            onClick={() => setSelectedAdmission(document)}
                            className={`w-full border-b-2 border-black p-3 text-left transition-colors last:border-b-0 ${
                              activeAdmission?.id === document.id
                                ? "bg-yellow-200"
                                : "bg-white hover:bg-gray-100"
                            }`}
                          >
                            <span className="block text-[11px] font-black text-gray-500">
                              {document.regionLabel}
                            </span>
                            <span className="block text-base font-black">
                              {document.university}
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="p-5 text-sm font-bold text-gray-500">
                          검색 결과 없음
                        </p>
                      )}
                    </div>
                  </div>
                </aside>

                {activeAdmission ? (
                  <section className="border-4 border-black bg-[#f8f8f8] min-h-[540px]">
                    <div className="flex flex-col gap-3 border-b-4 border-black bg-white p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <span className="inline-block border-2 border-black bg-[#00ff41] px-2 py-1 text-[11px] font-black">
                          {activeAdmission.regionLabel}
                        </span>
                        <h3 className="mt-2 text-2xl font-black">
                          {activeAdmission.university}
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={activeAdmission.file}
                          target="_blank"
                          rel="noreferrer"
                          className="border-4 border-black bg-blue-600 px-4 py-2 text-center text-sm font-black text-white hover:bg-blue-700"
                        >
                          새 창
                        </a>
                        <a
                          href={activeAdmission.file}
                          download={activeAdmission.downloadName}
                          className="border-4 border-black bg-black px-4 py-2 text-center text-sm font-black text-white hover:bg-gray-800"
                        >
                          다운로드
                        </a>
                      </div>
                    </div>
                    <iframe
                      title={`${activeAdmission.university} 2028 대입전형 시행계획`}
                      src={activeAdmission.file}
                      className="h-[64vh] min-h-[460px] w-full bg-white"
                    />
                  </section>
                ) : (
                  <section className="border-4 border-black bg-white p-8 text-center font-black">
                    검색 결과 없음
                  </section>
                )}
              </div>

              <button
                type="button"
                onClick={() => setView("career")}
                className="w-full bg-black text-white py-3 font-bold border-4 border-black hover:bg-gray-800"
              >
                BACK_TO_CAREER
              </button>
            </div>
          </section>
        ) : view === "medical-admissions" ? (
          <section className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-red-500 text-white px-4 py-2 border-b-4 border-black flex justify-between font-bold text-xs">
              <span>MEDICAL_2028.XLSX</span>
              <button type="button" onClick={() => setView("career")}>
                X
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black text-gray-500">
                    2028 진로진학
                  </p>
                  <h2 className="text-2xl md:text-3xl font-black">
                    {medicalAdmissionsWorkbook.title}
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={medicalAdmissionsWorkbook.sourceFile}
                    target="_blank"
                    rel="noreferrer"
                    className="border-4 border-black bg-blue-600 px-4 py-2 text-center text-sm font-black text-white hover:bg-blue-700"
                  >
                    새 창
                  </a>
                  <a
                    href={medicalAdmissionsWorkbook.sourceFile}
                    download={medicalAdmissionsWorkbook.downloadName}
                    className="border-4 border-black bg-black px-4 py-2 text-center text-sm font-black text-white hover:bg-gray-800"
                  >
                    다운로드
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 border-4 border-black">
                <button
                  type="button"
                  onClick={() => {
                    setMedicalDisplayMode("summary");
                    if (!medicalCareerSheetNames.includes(selectedMedicalSheetName)) {
                      setSelectedMedicalSheetName(defaultMedicalSheetName);
                    }
                    setExpandedMedicalRecordKey(null);
                  }}
                  className={`py-3 text-sm font-black ${
                    medicalDisplayMode === "summary"
                      ? "bg-black text-white"
                      : "bg-white text-black hover:bg-gray-100"
                  }`}
                >
                  요약 카드
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMedicalDisplayMode("table");
                    setExpandedMedicalRecordKey(null);
                  }}
                  className={`border-l-4 border-black py-3 text-sm font-black ${
                    medicalDisplayMode === "table"
                      ? "bg-black text-white"
                      : "bg-white text-black hover:bg-gray-100"
                  }`}
                >
                  원본 표
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {visibleMedicalSheets.map((sheet) => (
                  <button
                    type="button"
                    key={sheet.name}
                    onClick={() => {
                      setSelectedMedicalSheetName(sheet.name);
                      setMedicalRegion("all");
                      setExpandedMedicalRecordKey(null);
                    }}
                    className={`min-w-20 border-4 border-black px-4 py-2 text-sm font-black ${
                      activeMedicalSheet?.name === sheet.name
                        ? "bg-black text-white"
                        : "bg-white text-black hover:bg-gray-100"
                    }`}
                  >
                    {sheet.name}
                  </button>
                ))}
              </div>

              {medicalDisplayMode === "summary" ? (
                <section className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 border-4 border-black bg-[#f8f8f8] p-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
                    <input
                      type="search"
                      value={medicalQuery}
                      onChange={(event) => {
                        setMedicalQuery(event.target.value);
                        setExpandedMedicalRecordKey(null);
                      }}
                      className="border-4 border-black bg-white p-3 text-sm font-bold"
                      placeholder="대학명 검색"
                    />

                    <select
                      value={medicalRegion}
                      onChange={(event) => {
                        setMedicalRegion(event.target.value);
                        setExpandedMedicalRecordKey(null);
                      }}
                      className="border-4 border-black bg-white p-3 text-sm font-bold"
                    >
                      <option value="all">지역 전체</option>
                      {medicalRegionFilters.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>

                    <select
                      value={medicalAdmissionType}
                      onChange={(event) => {
                        setMedicalAdmissionType(
                          event.target.value as MedicalAdmissionType,
                        );
                        setExpandedMedicalRecordKey(null);
                      }}
                      className="border-4 border-black bg-white p-3 text-sm font-bold"
                    >
                      {medicalAdmissionTypeFilters.map((filter) => (
                        <option key={filter.id} value={filter.id}>
                          {filter.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={medicalCsatFilter}
                      onChange={(event) => {
                        setMedicalCsatFilter(
                          event.target.value as MedicalCsatFilter,
                        );
                        setExpandedMedicalRecordKey(null);
                      }}
                      className="border-4 border-black bg-white p-3 text-sm font-bold"
                    >
                      {medicalCsatFilters.map((filter) => (
                        <option key={filter.id} value={filter.id}>
                          {filter.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border-4 border-black bg-black px-3 py-2 text-xs font-bold text-white">
                    {activeMedicalSheet?.name ?? ""} / LIST{" "}
                    {filteredMedicalRecords.length} OF {medicalRecords.length}
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {filteredMedicalRecords.length > 0 ? (
                      filteredMedicalRecords.map((record) => {
                        const isExpanded =
                          expandedMedicalRecordKey === record.key;

                        return (
                          <article
                            key={record.key}
                            className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <div className="border-b-4 border-black p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <span className="inline-block border-2 border-black bg-[#00ff41] px-2 py-1 text-[11px] font-black">
                                    {record.region}
                                  </span>
                                  <h3 className="mt-2 text-xl font-black">
                                    {record.university}
                                  </h3>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedMedicalRecordKey(
                                      isExpanded ? null : record.key,
                                    )
                                  }
                                  className="shrink-0 border-4 border-black bg-yellow-300 px-3 py-2 text-xs font-black hover:bg-yellow-200"
                                >
                                  {isExpanded ? "접기" : "자세히"}
                                </button>
                              </div>

                              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                <div className="border-2 border-black bg-yellow-50 p-2">
                                  <span className="block text-[10px] font-black text-gray-500">
                                    교과
                                  </span>
                                  <span className="block text-sm font-black">
                                    {compactMedicalValue(record.curriculumCount)}
                                  </span>
                                </div>
                                <div className="border-2 border-black bg-yellow-50 p-2">
                                  <span className="block text-[10px] font-black text-gray-500">
                                    학종
                                  </span>
                                  <span className="block text-sm font-black">
                                    {compactMedicalValue(record.schoolRecordCount)}
                                  </span>
                                </div>
                                <div className="border-2 border-black bg-yellow-50 p-2">
                                  <span className="block text-[10px] font-black text-gray-500">
                                    정시
                                  </span>
                                  <span className="block text-sm font-black">
                                    {record.regularCountText}
                                  </span>
                                </div>
                              </div>

                              <p
                                className="mt-3 text-xs font-bold text-gray-600"
                                style={{
                                  display: "-webkit-box",
                                  WebkitBoxOrient: "vertical",
                                  WebkitLineClamp: 2,
                                  overflow: "hidden",
                                }}
                              >
                                최저: {record.csatSummary}
                              </p>
                            </div>

                            {isExpanded && (
                              <div className="divide-y-4 divide-black text-sm font-semibold">
                                <div className="grid gap-3 p-4 md:grid-cols-3">
                                  <div>
                                    <h4 className="mb-2 border-b-2 border-black pb-1 text-sm font-black">
                                      교과
                                    </h4>
                                    <p>모집 {compactMedicalValue(record.curriculumCount)}</p>
                                    <p className="whitespace-pre-line">
                                      {displayMedicalValue(record.curriculumMethod)}
                                    </p>
                                    <p className="mt-2 whitespace-pre-line text-xs text-gray-600">
                                      최저 {record.curriculumCsatArea || "-"} /{" "}
                                      {record.curriculumCsatCondition || "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="mb-2 border-b-2 border-black pb-1 text-sm font-black">
                                      학종
                                    </h4>
                                    <p>모집 {compactMedicalValue(record.schoolRecordCount)}</p>
                                    <p className="whitespace-pre-line">
                                      {displayMedicalValue(record.schoolRecordMethod)}
                                    </p>
                                    <p className="mt-2 whitespace-pre-line text-xs text-gray-600">
                                      최저 {record.schoolRecordCsatArea || "-"} /{" "}
                                      {record.schoolRecordCsatCondition || "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="mb-2 border-b-2 border-black pb-1 text-sm font-black">
                                      정시
                                    </h4>
                                    <p>모집 {record.regularCountText}</p>
                                    <p className="whitespace-pre-line">
                                      {displayMedicalValue(record.regularMethod)}
                                    </p>
                                    <p className="mt-2 text-xs text-gray-600">
                                      지표 {displayMedicalValue(record.regularIndicator)}
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 bg-[#f8f8f8] p-4 text-xs md:grid-cols-5">
                                  <span>국어 {compactMedicalValue(record.regularKorean)}</span>
                                  <span>영어 {compactMedicalValue(record.regularEnglish)}</span>
                                  <span>수학 {compactMedicalValue(record.regularMath)}</span>
                                  <span>사탐 {compactMedicalValue(record.regularSocial)}</span>
                                  <span>과탐 {compactMedicalValue(record.regularScience)}</span>
                                </div>
                              </div>
                            )}
                          </article>
                        );
                      })
                    ) : (
                      <section className="border-4 border-black bg-white p-8 text-center font-black lg:col-span-2">
                        검색 결과가 없습니다
                      </section>
                    )}
                  </div>
                </section>
              ) : activeMedicalSheet ? (
                <section className="border-4 border-black bg-[#f8f8f8]">
                  <div className="flex flex-col gap-1 border-b-4 border-black bg-black px-3 py-2 text-white sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-black">
                      SHEET: {activeMedicalSheet.name}
                    </span>
                    <span className="text-xs font-bold">
                      ROWS {activeMedicalSheet.rowCount} / COLS{" "}
                      {medicalColumnMetas.length}
                    </span>
                  </div>
                  <div className="max-h-[72vh] overflow-auto bg-white">
                    <table className="min-w-full border-separate border-spacing-0 text-[13px] leading-relaxed md:text-sm">
                      <thead className="sticky top-0 z-10">
                        {activeMedicalSheet.rows
                          .slice(0, activeMedicalSheet.headerRowCount)
                          .map((row, rowIndex) => (
                            <tr
                              key={`${activeMedicalSheet.name}-header-${rowIndex}`}
                            >
                              {medicalColumnMetas.map((meta) => (
                                <th
                                  key={`${activeMedicalSheet.name}-header-${rowIndex}-${meta.index}`}
                                  className={`border-b-2 border-r-2 border-black bg-yellow-100 px-3 py-3 text-center font-black align-middle ${
                                    meta.isDetailColumn
                                      ? "min-w-72 max-w-[460px]"
                                      : "min-w-28"
                                  }`}
                                  style={{
                                    overflowWrap: "anywhere",
                                    whiteSpace: "pre-line",
                                    wordBreak: "keep-all",
                                  }}
                                >
                                  {row[meta.index] || "\u00A0"}
                                </th>
                              ))}
                            </tr>
                          ))}
                      </thead>
                      <tbody>
                        {activeMedicalSheet.rows
                          .slice(activeMedicalSheet.headerRowCount)
                          .map((row, rowIndex) => (
                            <tr
                              key={`${activeMedicalSheet.name}-${rowIndex}`}
                              className={`${
                                rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                              } hover:bg-blue-50`}
                            >
                              {medicalColumnMetas.map((meta) => {
                                const cell = row[meta.index] || "";

                                return (
                                  <td
                                    key={`${activeMedicalSheet.name}-${rowIndex}-${meta.index}`}
                                    className={`border-b-2 border-r-2 border-black px-3 py-3 align-top ${
                                      meta.isDetailColumn
                                        ? "min-w-72 max-w-[460px] text-left text-[12px] md:text-[13px]"
                                        : "min-w-28"
                                    } ${
                                      meta.isUniversityColumn
                                        ? "bg-yellow-50 font-black"
                                        : "font-semibold"
                                    }`}
                                    style={{
                                      overflowWrap: "anywhere",
                                      whiteSpace: "pre-line",
                                      wordBreak: "keep-all",
                                    }}
                                  >
                                    {cell || "\u00A0"}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : (
                <section className="border-4 border-black bg-white p-8 text-center font-black">
                  표시할 시트가 없습니다
                </section>
              )}
              <button
                type="button"
                onClick={() => setView("career")}
                className="w-full bg-black text-white py-3 font-bold border-4 border-black hover:bg-gray-800"
              >
                BACK_TO_CAREER
              </button>
            </div>
          </section>
        ) : view === "meal-board" ? (
          <section className="max-w-2xl mx-auto bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#00ff41] text-black px-4 py-1 border-b-4 border-black flex justify-between font-bold text-xs">
              <span>MEAL_BOARD.EXE</span>
              <button type="button" onClick={resetView}>
                X
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border-4 border-black p-2 font-bold uppercase"
                />
                <button
                  type="button"
                  onClick={() => fetchDailyMeals(selectedDate)}
                  className="bg-black text-white px-6 font-bold border-4 border-black hover:bg-gray-800 transition-colors"
                >
                  SEARCH
                </button>
              </div>

              <div className="space-y-4 min-h-[150px]">
                {isMealLoading ? (
                  <p className="font-bold text-center py-8 animate-pulse text-gray-500">
                    LOADING_DATA...
                  </p>
                ) : dailyMeals.length > 0 ? (
                  dailyMeals.map((m, idx) => (
                    <div
                      key={`${m.type}-${idx}`}
                      className="border-4 border-black p-5 bg-yellow-50 relative mt-4"
                    >
                      <div className="absolute -top-3 left-4 bg-black text-white px-3 py-1 text-xs font-black uppercase border-2 border-black">
                        {m.type}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed font-bold">
                        {m.menu}
                      </p>
                    </div>
                  ))
                ) : null}
              </div>

              <button
                type="button"
                onClick={resetView}
                className="w-full bg-black text-white py-3 font-bold mt-4 border-4 border-black hover:bg-gray-800"
              >
                BACK_TO_HOME
              </button>
            </div>
          </section>
        ) : view === "notice-list" ? (
          <section className="max-w-2xl mx-auto bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-yellow-400 text-black px-4 py-1 border-b-4 border-black flex justify-between font-bold text-xs">
              <span>BULLETIN_BOARD.EXE</span>
              <button type="button" onClick={resetView}>
                X
              </button>
            </div>
            <div className="p-6 space-y-4">
              {isAdminAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    setNoticeError("");
                    setView("notice-write");
                  }}
                  className="w-full bg-blue-600 text-white py-3 font-black border-4 border-black mb-4 hover:bg-blue-700"
                >
                  WRITE_NOTICE
                </button>
              )}

              {noticeError && (
                <div className="border-4 border-red-600 bg-red-50 p-3 text-sm font-bold text-red-700">
                  {noticeError}
                </div>
              )}

              {loading ? (
                <p className="py-8 text-center text-sm font-bold text-gray-500">
                  LOADING_DATA...
                </p>
              ) : notices.length > 0 ? (
                notices.map((notice) => (
                  <div
                    key={notice.id}
                    className={`p-4 border-2 border-black ${
                      notice.is_important ? "bg-yellow-100" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-gray-400 font-bold">
                        {new Date(notice.created_at).toLocaleDateString()}
                      </span>
                      {isAdminAuthenticated && (
                        <button
                          type="button"
                          onClick={() => deleteNotice(notice.id)}
                          className="text-red-500 text-xs font-bold underline"
                        >
                          DELETE
                        </button>
                      )}
                    </div>
                    <h4 className="text-lg font-black">
                      {notice.is_important ? "[중요] " : ""}
                      {notice.title}
                    </h4>
                    <p className="text-sm mt-2 whitespace-pre-wrap">
                      {notice.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm font-bold text-gray-500">
                  등록된 공지 없음
                </p>
              )}
              <button
                type="button"
                onClick={resetView}
                className="w-full bg-black text-white py-3 font-bold mt-4"
              >
                BACK_TO_HOME
              </button>
            </div>
          </section>
        ) : view === "notice-write" ? (
          <section className="max-w-md mx-auto bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="space-y-4 text-left">
              <h2 className="text-xl font-black italic underline">
                POST_NOTICE
              </h2>
              <input
                type="text"
                value={noticeTitle}
                onChange={(event) => setNoticeTitle(event.target.value)}
                className="w-full border-2 border-black p-2 font-bold"
                placeholder="제목"
                disabled={isNoticeSaving}
              />
              <textarea
                value={noticeContent}
                onChange={(event) => setNoticeContent(event.target.value)}
                className="w-full border-2 border-black p-2 h-32"
                placeholder="내용"
                disabled={isNoticeSaving}
              />
              <label className="flex items-center space-x-2 bg-yellow-100 p-2 border-2 border-black border-dashed cursor-pointer">
                <input
                  type="checkbox"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="w-5 h-5 accent-black"
                />
                <span className="font-bold text-xs">중요 공지</span>
              </label>
              {noticeError && (
                <div className="border-4 border-red-600 bg-red-50 p-3 text-sm font-bold text-red-700">
                  {noticeError}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (noticeTitle.trim() && noticeContent.trim()) {
                      saveNotice(noticeTitle, noticeContent);
                    } else {
                      setNoticeError("제목과 내용을 입력하세요.");
                    }
                  }}
                  disabled={isNoticeSaving}
                  className="flex-1 bg-blue-600 text-white py-3 font-black border-4 border-black disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {isNoticeSaving ? "SAVING..." : "DB_COMMIT"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNoticeError("");
                    setView("notice-list");
                  }}
                  disabled={isNoticeSaving}
                  className="flex-1 bg-gray-300 text-black py-3 font-black border-4 border-black"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </section>
        ) : view === "admin" ? (
          <section className="max-w-md mx-auto bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            {!isAdminAuthenticated ? (
              <div className="space-y-4">
                <h2 className="text-xl font-black">ADMIN_LOGIN</h2>
                <input
                  type="password"
                  className="w-full border-4 border-black p-2"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="PASSWORD"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (adminPassword === ADMIN_PASSWORD) {
                      setIsAdminAuthenticated(true);
                      setAdminSessionPassword(adminPassword);
                      setNoticeError("");
                      setView(prevView);
                      setAdminPassword("");
                    } else {
                      alert("ACCESS DENIED");
                    }
                  }}
                  className="w-full bg-black text-white py-2 font-bold border-4 border-black"
                >
                  ACCESS
                </button>
                <button
                  type="button"
                  onClick={() => setView(prevView)}
                  className="w-full text-xs underline mt-2 text-center block text-gray-500"
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <h2 className="text-xl font-black text-blue-600">
                  ALREADY LOGGED IN
                </h2>
                <button
                  type="button"
                  onClick={() => setView(prevView)}
                  className="w-full bg-black text-white py-3 font-bold border-4 border-black"
                >
                  RETURN_TO_PREVIOUS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminAuthenticated(false);
                    setAdminSessionPassword("");
                    setNoticeError("");
                    setView("home");
                  }}
                  className="w-full bg-red-500 text-white py-3 font-bold border-4 border-black mt-2"
                >
                  LOGOUT
                </button>
              </div>
            )}
          </section>
        ) : (
          <section className="max-w-md mx-auto bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-black text-white px-4 py-1 flex justify-between text-xs font-bold">
              <span>TIMETABLE.EXE</span>
              <button type="button" onClick={resetView}>
                X
              </button>
            </div>
            <div className="p-8 space-y-6 text-center">
              <input
                type="text"
                className="w-full border-4 border-black p-3 font-bold"
                placeholder="학번 5자리"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  if (!studentId.trim()) alert("학번을 입력하세요.");
                  else setViewPath(`/timetables/${studentId}.png`);
                }}
                className="w-full bg-blue-500 text-white border-4 border-black py-4 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all"
              >
                SEARCH
              </button>
              {viewPath && (
                <div className="mt-6 border-t-4 border-dashed border-black pt-6">
                  <Image
                    src={viewPath}
                    alt="학생 시간표"
                    width={900}
                    height={1273}
                    className="border-4 border-black mb-4 w-full"
                    onError={() => {
                      alert("시간표 이미지를 찾을 수 없습니다.");
                      setViewPath("");
                    }}
                  />
                  <a
                    href={viewPath}
                    download
                    className="block w-full bg-[#00ff41] border-4 border-black py-4 font-black"
                  >
                    SAVE_IMAGE
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={resetView}
                className="w-full bg-black text-white py-3 font-bold mt-6 border-4 border-black hover:bg-gray-800"
              >
                BACK_TO_HOME
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="mt-20 text-center text-[10px] font-bold text-gray-400 pb-10">
        COPYRIGHT (C) 2026. DongT. ALL RIGHTS RESERVED
        <span
          className="cursor-default select-none"
          onClick={handleAdminTrigger}
        >
          .
        </span>
      </footer>

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
