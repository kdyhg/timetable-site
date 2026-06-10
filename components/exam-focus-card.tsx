import { StudyTimer } from "@/components/study-timer";
import type { ClassItem } from "@/lib/content";
import { formatDateString } from "@/lib/school";
import type { ExamFocus } from "@/lib/student-tools";
import { BookOpenCheck, ChevronRight } from "lucide-react";
import Link from "next/link";

export function ExamFocusCard({
  focus,
  items,
}: {
  focus: ExamFocus;
  items: ClassItem[];
}) {
  const relevant = items
    .filter(
      (item) =>
        ["시험", "수행평가"].includes(item.item_type) &&
        item.date >= focus.start &&
        item.date <= focus.end,
    )
    .slice(0, 4);

  return (
    <section className="mb-8 overflow-hidden rounded-lg border border-[#b5d9f7] bg-[#f4f9fd]">
      <div className="grid gap-6 p-5 md:grid-cols-[1.2fr_.8fr] md:p-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0075de]">
            <BookOpenCheck className="h-4 w-4" /> 시험 집중 모드
          </div>
          <h2 className="mt-3 text-2xl font-bold">
            {focus.title} {focus.daysUntil === 0 ? "진행 중" : `D-${focus.daysUntil}`}
          </h2>
          <p className="mt-2 text-sm text-[#615d59]">
            {formatDateString(focus.start, focus.end)}
          </p>
          <div className="mt-5 divide-y divide-[#dbeaf6] border-y border-[#dbeaf6]">
            {relevant.length ? (
              relevant.map((item) => (
                <Link
                  href="/school/assessments"
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <b>{item.title}</b>
                    <p className="mt-1 text-xs text-[#615d59]">
                      {formatDateString(item.date)}
                      {item.subject ? ` · ${item.subject}` : ""}
                      {item.scope ? ` · ${item.scope}` : ""}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#a39e98]" />
                </Link>
              ))
            ) : (
              <p className="py-4 text-sm text-[#615d59]">
                등록된 시험·수행평가 세부 일정이 없습니다.
              </p>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-[#dbeaf6] bg-white p-4">
          <p className="mb-3 text-sm font-semibold">지금 한 번 집중하기</p>
          <StudyTimer compact />
        </div>
      </div>
    </section>
  );
}
