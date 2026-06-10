import type { ApiResponse } from "@/lib/content";

export async function parseApiResponse<T>(
  responseOrPromise: Response | Promise<Response>,
): Promise<T> {
  const response = await responseOrPromise;
  const body = (await response.json().catch(() => ({}))) as ApiResponse<T>;
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
  return body.data as T;
}

export const adminHeaders = (password: string) => ({
  "Content-Type": "application/json",
  "x-admin-password": password,
});

export async function uploadFile(file: File, password: string) {
  const form = new FormData();
  form.set("file", file);
  return parseApiResponse<{ url: string; name: string }>(
    await fetch("/api/uploads", {
      method: "POST",
      headers: { "x-admin-password": password },
      body: form,
    }),
  );
}
