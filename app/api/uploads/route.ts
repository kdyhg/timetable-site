import { NextRequest } from "next/server";
import { jsonData, jsonError, requireAdmin } from "@/lib/api-server";

export const dynamic = "force-dynamic";

const MAX_SIZE = 10 * 1024 * 1024;

const extensionFromName = (name: string) => {
  const match = name.toLowerCase().match(/\.([a-z0-9]{1,12})$/);
  return match ? `.${match[1]}` : "";
};

const storageObjectName = (file: File) => {
  const extension = extensionFromName(file.name);
  const typeExtension = file.type.split("/")[1]?.replace(/[^a-z0-9]/gi, "");
  return `${crypto.randomUUID()}${extension || (typeExtension ? `.${typeExtension}` : "")}`;
};

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (admin.error) return admin.error;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError("첨부할 파일을 선택하세요.", 400);
  if (file.size > MAX_SIZE) return jsonError("첨부파일은 10MB 이하만 가능합니다.", 400);

  const path = `${new Date().toISOString().slice(0, 10)}/${storageObjectName(file)}`;
  const { error } = await admin.client.storage
    .from("class-files")
    .upload(path, file, { contentType: file.type || undefined });
  if (error) return jsonError(error.message);
  const { data } = admin.client.storage.from("class-files").getPublicUrl(path);
  return jsonData({ url: data.publicUrl, name: file.name }, 201);
}
