import { formatDateString } from "@/lib/school";
import type { ExamFocus } from "@/lib/student-tools";
import { BookOpenCheck, CalendarDays } from "lucide-react";
import Link from "next/link";

export function ExamFocusCard({ focus }: { focus: ExamFocus }) {
  return (
    <section className="mb-8 overflow-hidden rounded-lg border border-[#b5d9f7] bg-[#f4f9fd]">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
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
        </div>
        <Link href="/school/calendar" className="notion-button mobile-full-button shrink-0">
          <CalendarDays className="h-4 w-4" /> 학사일정 보기
        </Link>
      </div>
    </section>
  );
}
