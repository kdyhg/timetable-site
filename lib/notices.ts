export type Notice = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  is_important: boolean;
};

export type NoticesApiResponse = {
  notices?: Notice[];
  error?: string;
};

export async function parseNoticeResponse(response: Response) {
  const body = (await response.json().catch(() => ({}))) as NoticesApiResponse;
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
  return body;
}

export const getAdminPassword = () =>
  typeof window === "undefined"
    ? ""
    : window.sessionStorage.getItem("hg-admin-password") || "";

export const setAdminPassword = (password: string) => {
  window.sessionStorage.setItem("hg-admin-password", password);
};

export const clearAdminPassword = () => {
  window.sessionStorage.removeItem("hg-admin-password");
};
