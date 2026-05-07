"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PetCard from "@/components/PetCard";
import PetCreateForm from "@/components/PetCreateForm";

export default function PetsPage() {
  const router = useRouter();
  const [pets, setPets] = useState<any[]>([]);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/pets");
    const data = await res.json();
    setLoading(false);
    if (res.status === 401) return router.push("/login");
    if (!data.ok) return setError(data.error);
    setPets(data.data.pets);
    setAiEnabled(data.data.aiSettings.enabled);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">我的宠物</h1>
        <p className="mt-2 text-ink/65">状态会在访问和互动时按时间自动衰减。</p>
      </div>
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
