export const noticeCategories = [
  "일반",
  "중요",
  "준비물",
  "과제",
  "시험",
  "행사",
  "진로진학",
] as const;

export type NoticeCategory = (typeof noticeCategories)[number];

export const noticeImagePositions = ["top", "bottom", "hidden"] as const;
export type NoticeImagePosition = (typeof noticeImagePositions)[number];

export type Notice = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  is_important: boolean;
  category: NoticeCategory;
  due_date: string | null;
  publish_start: string | null;
  publish_end: string | null;
  link_url: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  image_position: NoticeImagePosition;
};

export type ApiResponse<T> = {
  data?: T;
  error?: string;
};

export const isExpiredNotice = (notice: Notice, today: string) =>
  Boolean(notice.publish_end && notice.publish_end < today);

export const isVisibleNotice = (notice: Notice, today: string) =>
  (!notice.publish_start || notice.publish_start <= today) &&
  (!notice.publish_end || notice.publish_end >= today);
