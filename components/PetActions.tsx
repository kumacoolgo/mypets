"use client";

const actions = [
  ["feed", "喂食"],
  ["play", "玩耍"],
  ["sleep", "睡觉"],
  ["bath", "洗澡"],
  ["work", "打工"]
] as const;

const aiActions = [
  ["ai-adventure", "AI 探险"],
  ["ai-play", "AI 游玩"],
  ["ai-work", "AI 打工"],
  ["ai-random-event", "AI 随机事件"]
] as const;

export default function PetActions({
  petId,
  aiEnabled,
  onDone
}: {
  petId: string;
  aiEnabled: boolean;
  onDone: (result?: any) => void;
}) {
  async function act(action: string) {
    const res = await fetch(`/api/pets/${petId}/${action}`, { method: "POST" });
    const data = await res.json();
    onDone(data.ok ? data.data.result : { error: data.error });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {actions.map(([key, label]) => (
          <button className="btn-soft" key={key} onClick={() => act(key)}>
            {label}
          </button>
        ))}
      </div>
      <div className="rounded-lg bg-mint/10 p-3">
        <div className="mb-2 text-sm font-black">AI 互动</div>
        {!aiEnabled && <p className="text-sm text-ink/60">AI 互动未启用</p>}
        <div className="flex flex-wrap gap-2">
          {aiActions.map(([key, label]) => (
            <button className="btn-primary" key={key} disabled={!aiEnabled} onClick={() => act(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
