"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import {
  admissionDocuments,
  admissionRegionFilters,
  type AdmissionDocument,
  type AdmissionRegionFilter,
} from "./admissions-data";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const OFFICE_CODE = process.env.NEXT_PUBLIC_OFFICE_CODE || "C10";
const SCHOOL_CODE = process.env.NEXT_PUBLIC_SCHOOL_CODE || "7150404";

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
type SupabaseError = {
  message?: string;
  details?: string;
  hint?: string;
};
type ViewType =
  | "home"
  | "timetable"
  | "notice-list"
  | "admin"
  | "meal-board"
  | "notice-write"
  | "admissions";

const mealCache = new Map<string, Meal[]>();

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const cleanMealMenu = (menu: string) =>
  menu.replace(/[0-9.]/g, "").replace(/<br\/?>/g, ", ");

const getSupabaseErrorMessage = (error: SupabaseError | null | undefined) => {
  if (!error) return "";
  return [error.message, error.details, error.hint].filter(Boolean).join(" ");
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

  const fetchMeal = async () => {
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
  };

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

  const fetchNotices = async () => {
    if (!supabase) {
      setNoticeError("Supabase 환경 변수가 설정되어 있지 않습니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setNoticeError("");

    try {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("is_important", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        setNoticeError(`공지사항을 불러오지 못했습니다. ${getSupabaseErrorMessage(error)}`);
        return;
      }

      setNotices((data ?? []) as Notice[]);
    } catch (error) {
      setNoticeError(
        `공지사항을 불러오지 못했습니다. ${
          error instanceof Error ? error.message : "네트워크 연결을 확인하세요."
        }`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeal();
    fetchNotices();
  }, []);

  const saveNotice = async (title: string, content: string) => {
    if (!supabase) {
      setNoticeError("Supabase 환경 변수가 설정되어 있지 않습니다.");
      return;
    }

    setIsNoticeSaving(true);
    setNoticeError("");

    try {
      const { error } = await supabase
        .from("notices")
        .insert([{ title: title.trim(), content: content.trim(), is_important: isImportant }]);

      if (error) {
        setNoticeError(`공지사항 저장에 실패했습니다. ${getSupabaseErrorMessage(error)}`);
        return;
      }

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
    if (!supabase) {
      setNoticeError("Supabase 환경 변수가 설정되어 있지 않습니다.");
      return;
    }

    if (confirm("삭제할까요?")) {
      setNoticeError("");
      const { error } = await supabase.from("notices").delete().eq("id", id);

      if (error) {
        setNoticeError(`공지사항 삭제에 실패했습니다. ${getSupabaseErrorMessage(error)}`);
        return;
      }

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
              label="PDF"
              title="2028 대입전형"
              subtitle="ADMISSION PLANS"
              color="bg-red-500 text-white"
              onClick={openAdmissions}
            />
          </section>
        ) : view === "admissions" ? (
          <section className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-red-500 text-white px-4 py-2 border-b-4 border-black flex justify-between font-bold text-xs">
              <span>ADMISSIONS_2028.PDF</span>
              <button type="button" onClick={resetView}>
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
                onClick={resetView}
                className="w-full bg-black text-white py-3 font-bold border-4 border-black hover:bg-gray-800"
              >
                BACK_TO_HOME
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
                    if (adminPassword === "5314") {
                      setIsAdminAuthenticated(true);
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
