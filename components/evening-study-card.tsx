import {
  formatEveningStudyDate,
  formatMaskedStudent,
  type EveningStudyGroup,
} from "@/lib/evening-study";
import { Clock3, MoonStar, UsersRound } from "lucide-react";

export function EveningStudyCard({
  groups,
  effectiveDate,
  offReason,
  emptyMessage = "오늘 야간자율학습 참석 예정자가 없습니다.",
}: {
  groups: EveningStudyGroup[];
  effectiveDate: string;
  offReason?: string | null;
  emptyMessage?: string;
}) {
  const total = groups.reduce((sum, group) => sum + group.students.length, 0);

  return (
    <div className="notion-card overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-[#e6e6e6] bg-[#fbfbfa] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#e7f2fc] text-[#0075de]">
            <MoonStar className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">참석 예정 명단</p>
            <p className="mt-0.5 text-xs text-[#787774]">
              {formatEveningStudyDate(effectiveDate)} 기준
            </p>
          </div>
        </div>
        {!offReason && (
          <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#0075de]">
            <UsersRound className="h-4 w-4" /> 총 {total}명
          </span>
        )}
      </div>

      {offReason ? (
        <p className="px-5 py-8 text-center text-sm text-[#615d59]">{offReason}</p>
      ) : total === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-[#615d59]">{emptyMessage}</p>
      ) : (
        <div className="divide-y divide-[#e6e6e6]">
          {groups.map((group) => (
            <div key={group.code} className="grid gap-3 px-4 py-4 sm:grid-cols-[170px_1fr] sm:px-5">
              <div>
                <p className="text-sm font-semibold">{group.label}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[#787774]">
                  <Clock3 className="h-3.5 w-3.5" />
                  {group.start}~{group.end}
                </p>
              </div>
              <div className="flex min-w-0 items-center sm:justify-end">
                {group.students.length ? (
                  <p className="text-sm leading-7 text-[#31302e]">
                    {group.students.map(formatMaskedStudent).join(" · ")}
                  </p>
                ) : (
                  <p className="text-sm text-[#a39e98]">해당 학생 없음</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
