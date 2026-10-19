"use client";
import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: "사이별", text: "우리 사이를 읽어볼래요?", url }); } catch {} }
    else copy();
  };
  return (
    <div className="grid gap-2">
      <div className="field text-sm text-ink-2 truncate select-all">{url}</div>
      <div className="flex gap-2">
        <button type="button" onClick={copy} className="btn btn-ghost flex-1">{copied ? "복사됐어요" : "링크 복사"}</button>
        <button type="button" onClick={share} className="btn btn-primary flex-1">보내기</button>
      </div>
    </div>
  );
}
