"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui";
import {
  fetchMeals,
  formatMealAllergenWarning,
  getLocalDateString,
  type Meal,
} from "@/lib/school";
import { AlertTriangle, Flame, Search, Utensils } from "lucide-react";
import { useEffect, useState } from "react";

function DetailList({ title, rows }: { title: string; rows: string[] }) {
  if (!rows.length) return null;

  return (
    <details className="rounded-md border border-[#e6e6e6] bg-[#fbfbfa] px-3 py-2">
      <summary className="cursor-pointer text-sm font-semibold text-[#31302e]">
        {title}
      </summary>
      <ul className="mt-3 space-y-1.5 text-xs leading-5 text-[#615d59]">
        {rows.map((row, index) => (
          <li key={`${title}-${index}-${row}`}>{row}</li>
        ))}
      </ul>
    </details>
  );
}

export default function MealsPage() {
  const [date, setDate] = useState(getLocalDateString());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = getLocalDateString();
  const dateLabel = date === today ? "오늘" : "선택한 날짜";

  const load = async (targetDate = date) => {
    setLoading(true);
    setError("");
    try {
      setMeals(await fetchMeals(targetDate));
    } catch {
      setMeals([]);
      setError("급식 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(getLocalDateString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader
        title="급식"
        description="날짜를 선택해 메뉴, 알레르기 유의 정보, 칼로리와 영양정보를 확인하세요."
        crumbs={[{ label: "홈", href: "/" }, { label: "학교생활" }, { label: "급식" }]}
      />
      <div className="notion-card mb-5 flex flex-col gap-2 p-4 sm:flex-row">
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="notion-input flex-1" />
        <button type="button" onClick={() => load()} className="notion-button notion-button-primary">
          <Search className="h-4 w-4" /> 조회
        </button>
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <div className="notion-card p-8 text-center text-sm text-[#787774]">급식 정보를 불러오는 중입니다.</div>
      ) : meals.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {meals.map((meal) => (
            <article key={meal.type} className="notion-card overflow-hidden">
              <div className="flex items-start justify-between gap-3 border-b border-[#e6e6e6] px-5 py-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Utensils className="h-4 w-4 text-[#0075de]" /> {meal.type}
                  </div>
                  {meal.loadDate && (
                    <p className="mt-1 text-xs text-[#787774]">
                      자료 갱신일 {meal.loadDate}
                    </p>
                  )}
                </div>
                {meal.calorie && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#f6f5f4] px-2.5 py-1 text-xs text-[#615d59]">
                    <Flame className="h-3.5 w-3.5" /> {meal.calorie}
                  </span>
                )}
              </div>

              <div className="space-y-5 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#787774]">메뉴</p>
                  {meal.menuItems.length ? (
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-[#31302e]">
                      {meal.menuItems.map((item) => (
                        <li key={item} className="rounded-md bg-[#fbfbfa] px-3 py-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-[#787774]">메뉴 정보가 없습니다.</p>
                  )}
                </div>

                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950">
                  <div className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-sm font-semibold">
                      {formatMealAllergenWarning(meal, dateLabel)}
                    </p>
                  </div>
                  {meal.allergenNames.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {meal.allergenNames.map((name) => (
                        <span key={name} className="rounded-full bg-white/75 px-2.5 py-1 text-xs font-medium">
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs leading-5">
                      표시된 알레르기 정보가 없습니다.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <DetailList title="영양정보" rows={meal.nutrition} />
                  <DetailList title="원산지정보" rows={meal.origin} />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="선택한 날짜의 급식 정보가 없습니다." />
      )}
    </>
  );
}
