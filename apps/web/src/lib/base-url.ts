// 서비스의 대표 주소. 초대 링크·공유 링크는 항상 이 주소로 만든다.
// 배포별 임시 주소(…-abc123-….vercel.app)가 링크에 섞이지 않도록 환경 변수 NEXT_PUBLIC_APP_URL을 우선한다.
import { headers } from "next/headers";

export async function baseUrl(): Promise<string> {
  const fixed = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL;
  if (fixed && /^https?:\/\//.test(fixed)) return fixed.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** 초대 메시지. 상대가 링크와 함께 받는 문장. */
export function inviteMessage(inviterName: string): string {
  return `${inviterName}님이 당신의 결을 더 알고 싶어 해요. 정보를 입력하고 ${inviterName}님의 결도 함께 알아보세요.`;
}
