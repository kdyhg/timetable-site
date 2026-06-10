import type { ClassItem, Notice } from "@/lib/content";
import { formatDateString } from "@/lib/school";
import { Download, ExternalLink } from "lucide-react";

const tones: Record<string, string> = {
  중요: "bg-red-50 text-red-700",
  시험: "bg-blue-50 text-blue-700",
  수행평가: "bg-violet-50 text-violet-700",
  제출: "bg-amber-50 text-amber-700",
  준비물: "bg-emerald-50 text-emerald-700",
  과제: "bg-orange-50 text-orange-700",
  행사: "bg-pink-50 text-pink-700",
  진로진학: "bg-cyan-50 text-cyan-700",
};

export function CategoryBadge({ label }: { label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
        tones[label] || "bg-[#f1f1ef] text-[#615d59]"
      }`}
    >
      {label}
    </span>
  );
}
export function ResourceLinks({
  linkUrl,
  attachmentUrl,
  attachmentName,
}: {
  linkUrl?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
}) {
  if (!linkUrl && !attachmentUrl) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {linkUrl && (
        <a href={linkUrl} target="_blank" rel="noreferrer" className="notion-button">
          <ExternalLink className="h-4 w-4" /> 링크 열기
        </a>
      )}
      {attachmentUrl && (
        <a href={attachmentUrl} target="_blank" rel="noreferrer" className="notion-button">
          <Download className="h-4 w-4" /> {attachmentName || "첨부파일"}
        </a>
      )}
    </div>
  );
}

export function ClassItemCard({ item }: { item: ClassItem }) {
  return (
    <article className="notion-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge label={item.item_type} />
        {item.subject && <span className="text-xs font-medium text-[#787774]">{item.subject}</span>}
      </div>
      <h3 className="mt-3 font-semibold">{item.title}</h3>
      <p className="mt-1 text-sm text-[#0075de]">{formatDateString(item.date, item.end_date)}</p>
      <dl className="mt-4 space-y-3 text-sm">
        {item.scope && <div><dt className="text-xs font-semibold text-[#787774]">범위</dt><dd className="mt-1 whitespace-pre-wrap leading-6">{item.scope}</dd></div>}
        {item.preparation && <div><dt className="text-xs font-semibold text-[#787774]">준비사항</dt><dd className="mt-1 whitespace-pre-wrap leading-6">{item.preparation}</dd></div>}
        {item.details && <div><dt className="text-xs font-semibold text-[#787774]">안내</dt><dd className="mt-1 whitespace-pre-wrap leading-6">{item.details}</dd></div>}
      </dl>
      <ResourceLinks linkUrl={item.link_url} attachmentUrl={item.attachment_url} attachmentName={item.attachment_name} />
    </article>
  );
}

export function NoticeMeta({ notice }: { notice: Notice }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <CategoryBadge label={notice.category} />
      {notice.due_date && <span className="text-xs font-medium text-[#0075de]">마감 {formatDateString(notice.due_date)}</span>}
    </div>
  );
}
