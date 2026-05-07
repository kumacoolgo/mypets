"use client";

import { useState } from "react";
import PetActions from "@/components/PetActions";
import PetStatusBar from "@/components/PetStatusBar";
import InteractionLogList from "@/components/InteractionLogList";

const typeEmoji: Record<string, string> = { cat: "🐱", dog: "🐶", slime: "🟢", robot: "🤖", bird: "🐦" };
const statusEmoji: Record<string, string> = { happy: "😄", hungry: "😵", tired: "😴", dirty: "😖", sick: "🤒", normal: "🙂" };

export default function PetCard({
  pet,
  aiEnabled,
  onChanged
}: {
  pet: any;
  aiEnabled: boolean;
  onChanged: () => void;
}) {
  const [lastResult, setLastResult] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  function done(result?: any) {
    setLastResult(result);
    onChanged();
  }

  async function deletePet() {
    if (!window.confirm(`确定要删除 ${pet.name} 吗？互动日志也会一起删除。`)) return;
    setDeleting(true);
    const response = await fetch(`/api/pets/${pet.id}`, { method: "DELETE" });
    const data = await response.json();
    setDeleting(false);
    if (!data.ok) {
      setLastResult({ error: data.error || "删除宠物失败" });
      return;
    }
    onChanged();
  }

  return (
    <article className="pet-card grid gap-6 p-5 md:grid-cols-[280px_1fr]">
      <div className="text-center">
        <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-full bg-honey/20 text-7xl shadow-inner">
          <span>{typeEmoji[pet.type] ?? "🐾"}</span>
          <span className="-ml-4 mt-20 text-4xl">{statusEmoji[pet.status] ?? "🙂"}</span>
        </div>
        <h2 className="mt-4 text-2xl font-black">{pet.name}</h2>
        <p className="text-sm font-semibold text-ink/60">
          Lv.{pet.level} · {pet.exp} exp · {pet.coins} 金币 · {pet.status}
        </p>
        <button
          className="mt-4 rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 ring-1 ring-red-100 transition hover:bg-red-50 disabled:opacity-50"
          type="button"
          onClick={deletePet}
          disabled={deleting}
        >
          {deleting ? "删除中..." : "删除宠物"}
        </button>
      </div>
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <PetStatusBar label="饱腹" value={pet.hunger} tone="bg-berry" />
            <div className="mt-1 flex justify-between text-[11px] font-semibold text-ink/45">
              <span>饥饿</span>
              <span>饱腹</span>
            </div>
          </div>
          <PetStatusBar label="心情" value={pet.mood} tone="bg-honey" />
          <PetStatusBar label="体力" value={pet.energy} tone="bg-mint" />
          <PetStatusBar label="清洁" value={pet.cleanliness} tone="bg-sky-400" />
        </div>
        <PetActions petId={pet.id} aiEnabled={aiEnabled} onDone={done} />
        {lastResult && (
          <div className="rounded-lg bg-white p-3 text-sm">
            {lastResult.error ? (
              <p className="font-semibold text-red-600">{lastResult.error}</p>
            ) : lastResult.title ? (
              <>
                <div className="font-black">{lastResult.title}</div>
                <p className="mt-1 text-ink/75">{lastResult.story}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-honey/20 px-2 py-1">EXP +{lastResult.expGain}</span>
                  <span className="rounded-full bg-mint/20 px-2 py-1">金币 +{lastResult.coinsGain}</span>
                  {lastResult.fallback && <span className="rounded-full bg-ink/10 px-2 py-1">本地 fallback</span>}
                </div>
              </>
            ) : (
              <p>获得 {lastResult.expGain ?? 0} EXP，{lastResult.coinsGain ?? 0} 金币</p>
            )}
          </div>
        )}
        <InteractionLogList logs={pet.logs ?? []} />
      </div>
    </article>
  );
}
