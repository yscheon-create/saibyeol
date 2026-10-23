// 서비스의 대표 주소. 초대 링크·공유 링크는 항상 이 주소로 만든다.
// 배포별 임시 주소(…-abc123-….vercel.app)가 링크에 섞이지 않도록 환경 변수 NEXT_PUBLIC_APP_URL을 우선한다.
import { headers } from "next/headers";

/** 우선순위: NEXT_PUBLIC_APP_URL(직접 지정) → Vercel 대표 주소(자동 제공) → AUTH_URL → 요청 헤더 */
export function fixedBaseUrl(): string | null {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  // Vercel이 production 배포에 자동으로 넣어주는 대표 도메인 (예: saibyeol.vercel.app)
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.AUTH_URL && /^https?:\/\//.test(process.env.AUTH_URL)) return process.env.AUTH_URL.replace(/\/+$/, "");
  return null;
}

export async function baseUrl(): Promise<string> {
  const fixed = fixedBaseUrl();
  if (fixed) return fixed;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** 초대 메시지. 상대가 링크와 함께 받는 문장. */
export function inviteMessage(inviterName: string): string {
  return `${inviterName}님이 당신의 결을 더 알고 싶어 해요. 정보를 입력하고 ${inviterName}님의 결도 함께 알아보세요.`;
}
