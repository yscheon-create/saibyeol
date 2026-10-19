"use client";
import { useActionState } from "react";
import { registerCounterpart } from "@/app/actions";

const TYPES = [
  ["family", "가족", "부모·자녀·형제자매·배우자"],
  ["friend", "친구", "오랜 친구, 최근 친해진 사람"],
  ["romance", "연인", "사귀는 사이, 썸, 배우자"],
  ["coworker", "직장동료", "같은 팀, 자주 협업하는 사람"],
] as const;

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerCounterpart, undefined);
  return (
    <form action={action} className="grid gap-6">
      <div>
        <label className="label" htmlFor="counterpartLabel">내가 부르는 이름</label>
        <input id="counterpartLabel" name="counterpartLabel" className="field" placeholder="예: 엄마, 민수, 박팀장" maxLength={20} required />
      </div>
      <div>
        <span className="label">어떤 사이인가요? <span className="text-ink-3 font-normal">여러 개 가능</span></span>
        <div className="grid gap-2">
          {TYPES.map(([v, label, desc]) => (
            <label key={v} className="card p-4 flex items-start gap-3 cursor-pointer has-[:checked]:border-ink">
              <input type="checkbox" name="types" value={v} className="mt-1" />
              <span>
                <span className="font-semibold">{label}</span>
                <span className="block text-xs text-ink-3 mt-0.5">{desc}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-ink-3 mt-2">배우자는 가족과 연인을 함께 골라보세요. 같은 사람도 관계마다 다르게 읽혀요.</p>
      </div>
      {state?.error && <p className="text-sm text-warm">{state.error}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "잠시만요…" : "초대 링크 만들기"}</button>
    </form>
  );
}
