"use client";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui";
import { fetchMeals, getLocalDateString, type Meal } from "@/lib/school";
import { Search, Utensils } from "lucide-react";
import { useEffect, useState } from "react";

export default function MealsPage() {
  const [date, setDate] = useState(getLocalDateString());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        description="날짜를 선택해 조식·중식·석식 정보를 확인하세요."
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
            <article key={meal.type} className="notion-card p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Utensils className="h-4 w-4 text-[#0075de]" /> {meal.type}
              </div>
              <p className="mt-4 text-sm leading-7 text-[#31302e]">{meal.menu}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="선택한 날짜의 급식 정보가 없습니다." />
      )}
    </>
  );
}
