import type { Notice, NoticeImagePosition } from "@/lib/content";
import { formatDateString } from "@/lib/school";
import { Download, ExternalLink, Image as ImageIcon } from "lucide-react";

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

export const isImageAttachment = (
  attachmentUrl?: string | null,
  attachmentName?: string | null,
) => {
  if (!attachmentUrl) return false;
  const value = `${attachmentName ?? ""} ${attachmentUrl ?? ""}`.toLowerCase();
  return /\.(avif|gif|jpe?g|png|webp)(?:[?#]\S*)?(?:\s|$)/i.test(value);
};

export function NoticeImageIndicator({ notice }: { notice: Notice }) {
  if (!isImageAttachment(notice.attachment_url, notice.attachment_name)) return null;

  return (
    <span
      aria-label="사진 첨부"
      title="사진 첨부"
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e8f3ff] text-[#0075de]"
    >
      <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
  );
}

export function NoticeImagePreview({
  notice,
  className = "",
}: {
  notice: Notice;
  className?: string;
}) {
  if (!isImageAttachment(notice.attachment_url, notice.attachment_name)) return null;

  return (
    <a
      href={notice.attachment_url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className={`mt-4 block overflow-hidden rounded-lg border border-[#e6e6e6] bg-[#fbfbfa] ${className}`}
    >
      <img
        src={notice.attachment_url ?? ""}
        alt={notice.attachment_name || `${notice.title} 첨부 사진`}
        className="max-h-[520px] w-full object-contain"
      />
    </a>
  );
}

export const stripNoticePhotoMarkers = (content: string) =>
  content.replace(/\[사진\]/g, "").trim();

function NoticeText({ content }: { content: string }) {
  if (!content) return null;

  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[#31302e]">
      {content}
    </p>
  );
}

export function NoticeBodyWithImage({ notice }: { notice: Notice }) {
  const hasImage = isImageAttachment(notice.attachment_url, notice.attachment_name);
  const position: NoticeImagePosition = notice.image_position ?? "bottom";

  if (!hasImage || position === "hidden") {
    return (
      <div className="mt-4">
        <NoticeText content={stripNoticePhotoMarkers(notice.content)} />
      </div>
    );
  }

  const marker = "[사진]";
  const markerIndex = notice.content.indexOf(marker);
  if (markerIndex >= 0) {
    const before = stripNoticePhotoMarkers(notice.content.slice(0, markerIndex));
    const after = stripNoticePhotoMarkers(notice.content.slice(markerIndex + marker.length));

    return (
      <div className="mt-4 space-y-4">
        <NoticeText content={before} />
        <NoticeImagePreview notice={notice} className="mt-0" />
        <NoticeText content={after} />
      </div>
    );
  }

  const body = stripNoticePhotoMarkers(notice.content);
  return (
    <div className="mt-4 space-y-4">
      {position === "top" && <NoticeImagePreview notice={notice} className="mt-0" />}
      <NoticeText content={body} />
      {position === "bottom" && <NoticeImagePreview notice={notice} className="mt-0" />}
    </div>
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
  const imageAttachment = isImageAttachment(attachmentUrl, attachmentName);
  return (
    <div className="mt-4 flex flex-wrap gap-2 max-sm:flex-col">
      {linkUrl && (
        <a href={linkUrl} target="_blank" rel="noreferrer" className="notion-button mobile-full-button">
          <ExternalLink className="h-4 w-4" /> 링크 열기
        </a>
      )}
      {attachmentUrl && (
        <a href={attachmentUrl} target="_blank" rel="noreferrer" className="notion-button mobile-full-button">
          {imageAttachment ? <ImageIcon className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          {imageAttachment ? "원본 이미지 열기" : attachmentName || "첨부파일"}
        </a>
      )}
    </div>
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
