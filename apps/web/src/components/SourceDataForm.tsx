"use client";
// 내 정보 입력 폼. /me 와 /i/[token] 에서 같이 쓴다. 출생시간은 "모름"을 고를 수 있다.
import { useActionState, useState } from "react";
import type { ActionState } from "@/app/actions";
import type { SourceDataForm as Values } from "@/server/source-data";

interface Props {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: Values | null;
  initialDisplayName?: string;
  submitLabel: string;
  hidden?: Record<string, string>;
}

export function SourceDataForm({ action, initial, initialDisplayName, submitLabel, hidden }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [calendar, setCalendar] = useState<"solar" | "lunar">(initial?.calendarType ?? "solar");
  const [timeKind, setTimeKind] = useState<"known" | "unknown">(initial?.birthTime ? "known" : "unknown");
  const [h, m] = (initial?.birthTime ?? ":").split(":");

  return (
    <form action={formAction} className="grid gap-5">
      {hidden && Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}

      <div>
        <label className="label" htmlFor="displayName">상대에게 보일 이름</label>
        <input id="displayName" name="displayName" className="field" placeholder="예: 지은, 아빠, 김대리" maxLength={20}
          defaultValue={initialDisplayName ?? ""} required />
        <p className="text-xs text-ink-3 mt-1">실명이 아니어도 돼요. 상대가 나를 알아볼 수 있는 이름이면 충분해요.</p>
      </div>

      <div>
        <label className="label" htmlFor="birthDate">생년월일</label>
        <input id="birthDate" name="birthDate" type="date" className="field" defaultValue={initial?.birthDate ?? ""} required
          min="1900-01-01" max="2100-12-31" />
        <div className="flex gap-4 mt-2 text-sm">
          {(["solar", "lunar"] as const).map((c) => (
            <label key={c} className="flex items-center gap-1.5">
              <input type="radio" name="calendarType" value={c} checked={calendar === c} onChange={() => setCalendar(c)} />
              {c === "solar" ? "양력" : "음력"}
            </label>
          ))}
          {calendar === "lunar" && (
            <label className="flex items-center gap-1.5 text-ink-2">
              <input type="checkbox" name="isLeapMonth" defaultChecked={initial?.isLeapMonth ?? false} /> 윤달
            </label>
          )}
        </div>
      </div>

      <div>
        <span className="label">출생시간</span>
        <div className="flex gap-4 text-sm mb-2">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="birthTimeKind" value="known" checked={timeKind === "known"} onChange={() => setTimeKind("known")} /> 알아요
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="birthTimeKind" value="unknown" checked={timeKind === "unknown"} onChange={() => setTimeKind("unknown")} /> 몰라요
          </label>
        </div>
        {timeKind === "known" ? (
          <div className="flex items-center gap-2">
            <select name="birthHour" className="field" defaultValue={h ?? ""} required>
              <option value="" disabled>시</option>
              {Array.from({ length: 24 }, (_, i) => <option key={i} value={String(i).padStart(2, "0")}>{i}시</option>)}
            </select>
            <select name="birthMinute" className="field" defaultValue={m || "00"}>
              {["00", "10", "20", "30", "40", "50"].map((v) => <option key={v} value={v}>{v}분</option>)}
            </select>
          </div>
        ) : (
          <p className="text-xs text-ink-3">몰라도 괜찮아요. 나중에 추가하면 해석이 더 정밀해져요.</p>
        )}
      </div>

      <div>
        <span className="label">성별</span>
        <div className="flex gap-4 text-sm">
          {(["female", "male"] as const).map((g) => (
            <label key={g} className="flex items-center gap-1.5">
              <input type="radio" name="gender" value={g} defaultChecked={initial?.gender === g} required /> {g === "female" ? "여성" : "남성"}
            </label>
          ))}
        </div>
      </div>

      {state?.error && <p className="text-sm text-warm">{state.error}</p>}

      <button type="submit" className="btn btn-primary mt-2" disabled={pending}>
        {pending ? "잠시만요…" : submitLabel}
      </button>
      <p className="text-xs text-ink-3 leading-relaxed">
        생년월일과 출생시간은 나만 볼 수 있어요. 상대에게는 거기서 읽어낸 성향과 두 사람 사이의 해석만 보여요.
      </p>
    </form>
  );
}
