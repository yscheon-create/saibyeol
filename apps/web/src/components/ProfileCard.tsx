import type { ProfileCardSummary } from "@/server/profile";

export function ProfileCard({ name, summary }: { name: string; summary: ProfileCardSummary }) {
  return (
    <div className="card p-6">
      <p className="text-xs font-semibold text-accent">나의 결</p>
      <h2 className="text-2xl font-bold mt-1 tracking-tight">{name}</h2>
      <dl className="mt-5 grid gap-4">
        {summary.lines.map((l) => (
          <div key={l.label}>
            <dt className="text-xs text-ink-3 font-semibold">{l.label}</dt>
            <dd className="mt-0.5 leading-relaxed">{l.text}</dd>
          </div>
        ))}
      </dl>
      {!summary.hasBirthTime && (
        <p className="mt-5 text-xs text-ink-3">출생시간을 더하면 이 카드가 더 정밀해져요.</p>
      )}
    </div>
  );
}
