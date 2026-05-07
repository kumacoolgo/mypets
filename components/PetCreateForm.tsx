"use client";

export default function PetCreateForm({ onCreated }: { onCreated: () => void }) {
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch("/api/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), type: form.get("type") })
    });
    event.currentTarget.reset();
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
        <button className="btn-primary">领养</button>
      </div>
    </form>
  );
}
