"use client";

import gradeData from "@/app/data/grade-conversions-2026.json";
import { PageHeader } from "@/components/page-header";
import {
  ArrowRight,
  Calculator,
  ExternalLink,
  Info,
  Minus,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";

const clampHundredths = (value: number) => Math.min(500, Math.max(100, value));
const formatGrade = (value: number) => value.toFixed(2);

export default function GradeConverterPage() {
  const [sourceHundredths, setSourceHundredths] = useState(150);
  const [inputValue, setInputValue] = useState("1.50");

  const result = gradeData.rules[sourceHundredths - 100];
  const benchmarks = useMemo(
    () =>
      [100, 150, 200, 250, 300, 350, 400, 450, 500].map((hundredths) => ({
        hundredths,
        rule: gradeData.rules[hundredths - 100],
      })),
    [],
  );

  const setGrade = (hundredths: number) => {
    const next = clampHundredths(hundredths);
    setSourceHundredths(next);
    setInputValue((next / 100).toFixed(2));
  };

  const rangeLeft = ((result.min - 1) / 8) * 100;
  const rangeWidth = Math.max(((result.max - result.min) / 8) * 100, 1.5);

  return (
    <>
      <PageHeader
        eyebrow="부산교육청 공개 자료 기준"
        title="5등급제 → 9등급제 예상 범위"
        description="5등급제 평균 등급을 입력하면 공식 변환표의 해당 값을 바로 보여줍니다. 계산식으로 추정하지 않고 401개 기준값을 조회합니다."
        crumbs={[
          { label: "홈", href: "/" },
          { label: "2028 진로진학", href: "/career/2028" },
          { label: "등급 변환" },
        ]}
        actions={
          <a
            href={gradeData.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="notion-button"
          >
            공식 페이지 <ExternalLink className="h-4 w-4" />
          </a>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,.9fr)_minmax(380px,1.1fr)]">
        <section className="notion-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-[#0075de]" />
            <h2 className="font-semibold">5등급제 평균 등급</h2>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGrade(sourceHundredths - 1)}
              disabled={sourceHundredths <= 100}
              className="touch-icon-button border border-[#e6e6e6] bg-white disabled:opacity-35"
              aria-label="0.01 낮추기"
              title="0.01 낮추기"
            >
              <Minus className="h-4 w-4" />
            </button>
            <label className="min-w-0 flex-1">
              <span className="sr-only">5등급제 평균 등급 입력</span>
              <input
                type="number"
                inputMode="decimal"
                min="1"
                max="5"
                step="0.01"
                value={inputValue}
                onChange={(event) => {
                  const value = event.target.value;
                  setInputValue(value);
                  const parsed = Number(value);
                  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 5) {
                    setSourceHundredths(clampHundredths(Math.round(parsed * 100)));
                  }
                }}
                onBlur={() => setGrade(sourceHundredths)}
                className="notion-input w-full text-center text-2xl font-bold tabular-nums"
                aria-describedby="grade-input-help"
              />
            </label>
            <button
              type="button"
              onClick={() => setGrade(sourceHundredths + 1)}
              disabled={sourceHundredths >= 500}
              className="touch-icon-button border border-[#e6e6e6] bg-white disabled:opacity-35"
              aria-label="0.01 높이기"
              title="0.01 높이기"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p id="grade-input-help" className="mt-2 text-center text-xs text-[#787774]">
            1.00부터 5.00까지, 소수 둘째 자리 단위
          </p>

          <input
            type="range"
            min="100"
            max="500"
            step="1"
            value={sourceHundredths}
            onChange={(event) => setGrade(Number(event.target.value))}
            className="mt-7 h-11 w-full cursor-pointer accent-[#0075de]"
            aria-label="5등급제 평균 등급 슬라이더"
          />
          <div className="flex justify-between text-xs text-[#787774]">
            <span>1.00</span>
            <span>3.00</span>
            <span>5.00</span>
          </div>

          <div className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-9">
            {benchmarks.map(({ hundredths }) => (
              <button
                key={hundredths}
                type="button"
                onClick={() => setGrade(hundredths)}
                className={`min-h-11 rounded-md border text-xs font-semibold ${
                  sourceHundredths === hundredths
                    ? "border-[#0075de] bg-[#e8f3fc] text-[#005bab]"
                    : "border-[#e6e6e6] bg-white hover:bg-[#f6f5f4]"
                }`}
              >
                {(hundredths / 100).toFixed(1)}
              </button>
            ))}
          </div>
        </section>

        <section className="notion-card overflow-hidden">
          <div className="border-b border-[#e6e6e6] bg-[#fbfbfa] px-5 py-4 sm:px-6">
            <p className="text-sm font-semibold text-[#615d59]">9등급제 예상 범위</p>
          </div>
          <div className="p-5 sm:p-7">
            <div className="flex items-center gap-3 text-sm text-[#787774]">
              <span className="font-semibold text-[#191919]">{(sourceHundredths / 100).toFixed(2)}</span>
              <ArrowRight className="h-4 w-4" />
              <span>9등급제 환산</span>
            </div>
            <p className="mt-4 break-words text-4xl font-bold leading-none tabular-nums text-[#191919] sm:text-5xl md:text-6xl">
              {formatGrade(result.min)} <span className="text-[#a39e98]">~</span> {formatGrade(result.max)}
            </p>
            <p className="mt-4 text-sm leading-6 text-[#615d59]">
              입력한 5등급제 평균은 9등급제에서 위 범위로 예상됩니다.
            </p>

            <div className="mt-8">
              <div className="relative h-3 rounded-full bg-[#e9e9e7]">
                <span
                  className="absolute inset-y-0 rounded-full bg-[#0075de]"
                  style={{ left: `${rangeLeft}%`, width: `${rangeWidth}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-[#787774]">
                <span>9등급제 1.00</span>
                <span>9.00</span>
              </div>
            </div>

            <div className="mt-7 flex gap-3 rounded-md bg-[#f1f1ef] p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#615d59]" />
              <p className="text-xs leading-5 text-[#615d59]">
                이 값은 합격 가능성을 뜻하지 않습니다. 2028 대입은 교과 성적 외에도 과목 선택, 세부능력특기사항, 활동 등을 함께 평가할 수 있습니다.
              </p>
            </div>
          </div>
        </section>
      </div>

      <details className="notion-card mt-5 overflow-hidden">
        <summary className="flex min-h-12 cursor-pointer items-center px-4 py-3 text-sm font-semibold sm:px-5">
          자료 기준과 유의사항
        </summary>
        <div className="space-y-3 border-t border-[#e6e6e6] p-4 text-sm leading-6 text-[#615d59] sm:p-5">
          <p>부산 관내 93개 고등학교 14,977명의 내신 산출 전 과목 조사에 보정값을 반영한 3학년 1학기 기준 예상 자료입니다.</p>
          <p>실제 학생 분포와 과목 구성에 따라 결과가 달라질 수 있으므로 진학 상담을 위한 참고값으로 사용하세요.</p>
          <p>기준연도 {gradeData.baseYear} · 401개 변환값 · 데이터 확인일 {gradeData.retrievedAt}</p>
        </div>
      </details>
    </>
  );
}
