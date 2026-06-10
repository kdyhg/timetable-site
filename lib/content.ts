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
};

export const classItemTypes = ["시험", "수행평가", "제출", "준비물"] as const;
export type ClassItemType = (typeof classItemTypes)[number];

export type ClassItem = {
  id: number;
  item_type: ClassItemType;
  title: string;
  subject: string | null;
  date: string;
  end_date: string | null;
  scope: string | null;
  preparation: string | null;
  details: string | null;
  link_url: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
};

export type RoadmapItem = {
  id: number;
  month: string;
  title: string;
  description: string;
  action_points: string[];
  link_url: string | null;
  created_at: string;
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
