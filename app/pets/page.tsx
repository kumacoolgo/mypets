"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PetCard from "@/components/PetCard";
import PetCreateForm from "@/components/PetCreateForm";

export default function PetsPage() {
  const router = useRouter();
  const [pets, setPets] = useState<any[]>([]);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoCareMessages, setAutoCareMessages] = useState<string[]>([]);
  const autoCareKeys = useRef(new Set<string>());

  async function load() {
    const res = await fetch("/api/pets");
    const data = await res.json();
    setLoading(false);
    if (res.status === 401) return router.push("/login");
    if (!data.ok) return setError(data.error);
    setPets(data.data.pets);
    setAiEnabled(data.data.aiSettings.enabled);
    triggerAutoCare(data.data.pets, data.data.aiSettings.enabled);
  }

  async function triggerAutoCare(currentPets: any[], enabledAi: boolean) {
    for (const pet of currentPets) {
      if (pet.hunger <= 10 && !autoCareKeys.current.has(`${pet.id}:fullness`)) {
        autoCareKeys.current.add(`${pet.id}:fullness`);
        setAutoCareMessages((items) => [`${pet.name} 已经很饿了，自动喂食一次。`, ...items].slice(0, 4));
        await fetch(`/api/pets/${pet.id}/feed`, { method: "POST" });
        load();
        return;
      }
      if (pet.mood <= 10 && !autoCareKeys.current.has(`${pet.id}:mood`)) {
        autoCareKeys.current.add(`${pet.id}:mood`);
        const action = enabledAi ? "ai-play" : "play";
        setAutoCareMessages((items) => [`${pet.name} 心情很低，自动安排${enabledAi ? "AI 游玩" : "玩耍"}。`, ...items].slice(0, 4));
        await fetch(`/api/pets/${pet.id}/${action}`, { method: "POST" });
        load();
        return;
      }
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">我的宠物</h1>
        <p className="mt-2 text-ink/65">饱腹、心情、体力、清洁会随着时间缓慢降低，访问和互动时自动计算。</p>
      </div>
      {autoCareMessages.length > 0 && (
        <div className="space-y-2">
          {autoCareMessages.map((message) => (
            <div key={message} className="pet-card border-honey/60 p-3 text-sm font-semibold text-ink">
              {message}
            </div>
          ))}
        </div>
      )}
      {loading && <div className="pet-card p-6">加载中...</div>}
      {error && <div className="pet-card p-6 text-red-600">{error}</div>}
      {!loading && pets.length === 0 && <PetCreateForm onCreated={load} />}
      <div className="space-y-5">
        {pets.map((pet) => (
          <PetCard key={pet.id} pet={pet} aiEnabled={aiEnabled} onChanged={load} />
        ))}
      </div>
    </div>
  );
}
