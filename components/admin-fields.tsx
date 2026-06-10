"use client";

import { uploadFile } from "@/lib/client-api";
import { Upload } from "lucide-react";
import { useState } from "react";

export function AttachmentFields({
  password,
  linkUrl,
  onLinkUrl,
  attachmentUrl,
  attachmentName,
  onAttachment,
  disabled,
}: {
  password: string;
  linkUrl: string;
  onLinkUrl: (value: string) => void;
  attachmentUrl: string;
  attachmentName: string;
  onAttachment: (url: string, name: string) => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <label className="space-y-1.5 text-sm font-medium">
        <span>외부 링크</span>
        <input value={linkUrl} onChange={(event) => onLinkUrl(event.target.value)} className="notion-input w-full font-normal" placeholder="https://..." disabled={disabled} />
      </label>
      <div className="space-y-1.5 text-sm font-medium">
        <span>첨부파일</span>
        <label className="notion-button w-full cursor-pointer">
          <Upload className="h-4 w-4" /> {uploading ? "업로드 중..." : attachmentName || "파일 선택 (최대 10MB)"}
          <input type="file" className="sr-only" disabled={disabled || uploading} onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setUploading(true); setError("");
            try { const uploaded = await uploadFile(file, password); onAttachment(uploaded.url, uploaded.name); }
            catch (reason) { setError(reason instanceof Error ? reason.message : "파일 업로드에 실패했습니다."); }
            finally { setUploading(false); }
          }} />
        </label>
        {attachmentUrl && <button type="button" onClick={() => onAttachment("", "")} className="text-xs text-red-600">첨부파일 제거</button>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
