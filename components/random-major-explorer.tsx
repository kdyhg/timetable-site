"use client";

import { parseApiResponse } from "@/lib/client-api";
import { Dices, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type RecommendationRecord = {
  id: string;
  area: string;
  region: string;
  university: string;
  department: string;
  coreSubjects: string;
  recommendedSubjects: string;
};

export function RandomMajorExplorer() {
  const [record, setRecord] = useState<RecommendationRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pickRandom = async () => {
    setLoading(true);
    setError("");
    try {
      setRecord(
        await parseApiResponse<RecommendationRecord>(
          fetch("/api/random-major", { cache: "no-store" }),
        ),
      );
    } catch {
      setError("학과 정보를 불러오지 못했습니다. 잠시 후 다시 시도하세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-10 border-t border-[#e6e6e6] pt-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0075de]">가볍게 둘러보기</p>
          <h2 className="mt-1 text-xl font-semibold">랜덤 학과 탐색</h2>
          <p className="mt-2 text-sm leading-6 text-[#787774]">
            1,358개 모집단위 중 하나를 뽑아 새로운 전공을 발견해 보세요.
          </p>
        </div>
        <button
          type="button"
          onClick={pickRandom}
          disabled={loading}
          className="notion-button notion-button-primary mobile-full-button shrink-0 disabled:opacity-60"
        >
          <Dices className="h-4 w-4" />
          {loading ? "찾는 중..." : record ? "다른 학과 보기" : "학과 하나 발견하기"}
        </button>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {record && (
        <article className="notion-card p-5 sm:p-6">
          <p className="text-xs font-semibold text-[#0075de]">
            {record.region} · {record.area}
          </p>
          <h3 className="mt-2 text-xl font-bold sm:text-2xl">
            {record.university} {record.department}
          </h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-md bg-[#f6f5f4] p-4">
              <p className="text-xs font-semibold text-[#787774]">핵심과목</p>
              <p className="mt-2 text-sm leading-6">
                {record.coreSubjects || "별도 안내 없음"}
              </p>
            </div>
            <div className="rounded-md bg-[#f6f5f4] p-4">
              <p className="text-xs font-semibold text-[#787774]">권장과목</p>
              <p className="mt-2 text-sm leading-6">
                {record.recommendedSubjects || "별도 안내 없음"}
              </p>
            </div>
          </div>
          <Link
            href={`/career/2028/recommended-subjects?q=${encodeURIComponent(
              `${record.university} ${record.department}`,
            )}`}
            className="notion-button mt-5 mobile-full-button"
          >
            <ExternalLink className="h-4 w-4" /> 자세히 보기
          </Link>
        </article>
      )}
    </section>
  );
}
