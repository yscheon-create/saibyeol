"use client";
// 초대 링크 복사·보내기. 링크만이 아니라 안내 문장과 함께 보낸다.
import { useState } from "react";

export function CopyLink({ url, message }: { url: string; message: string }) {
  const [copied, setCopied] = useState<"link" | "message" | null>(null);
  const full = `${message}\n${url}`;
  const copy = async (what: "link" | "message") => {
    try {
      await navigator.clipboard.writeText(what === "link" ? url : full);
      setCopied(what); setTimeout(() => setCopied(null), 1500);
    } catch {}
  };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: "사이별", text: message, url }); return; } catch {} }
    await copy("message");
  };
  return (
    <div className="grid gap-3">
      <div className="rounded-xl bg-paper-2 p-4 text-sm leading-relaxed">
        <p>{message}</p>
        <p className="mt-2 text-ink-2 break-all select-all">{url}</p>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => copy("message")} className="btn btn-ghost flex-1">
          {copied === "message" ? "복사됐어요" : "문장과 함께 복사"}
        </button>
        <button type="button" onClick={share} className="btn btn-primary flex-1">카카오톡으로 보내기</button>
      </div>
      <button type="button" onClick={() => copy("link")} className="text-xs text-ink-3 hover:text-ink text-left">
        {copied === "link" ? "링크가 복사됐어요" : "링크만 복사"}
      </button>
    </div>
  );
}
