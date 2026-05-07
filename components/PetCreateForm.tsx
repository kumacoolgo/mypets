"use client";

import { useState } from "react";

export default function PetCreateForm({ onCreated }: { onCreated: () => void }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), type: form.get("type") })
    });
    const data = await response.json();
    setLoading(false);
    if (!data.ok) {
      setError(data.error || "领养失败");
      return;
    }
    event.currentTarget.reset();
    setMessage(`已经成功领养 ${data.data.pet.name}！`);
    onCreated();
  }

  return (
    <form className="pet-card p-5" onSubmit={submit}>
      <h2 className="text-xl font-black">创建你的第一只宠物</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_auto]">
        <input className="field" name="name" placeholder="宠物名字，例如 Momo" />
        <select className="field" name="type" defaultValue="cat">
          <option value="cat">🐱 cat</option>
          <option value="dog">🐶 dog</option>
          <option value="slime">🟢 slime</option>
          <option value="robot">🤖 robot</option>
          <option value="bird">🐦 bird</option>
        </select>
        <button className="btn-primary" disabled={loading}>
          {loading ? "领养中..." : "领养"}
        </button>
      </div>
      {message && <p className="mt-3 rounded-lg bg-mint/15 px-3 py-2 text-sm font-semibold text-ink">{message}</p>}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
    </form>
  );
}
