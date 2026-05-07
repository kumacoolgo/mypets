"use client";

import { useState } from "react";

export default function FriendPanel({
  currentUserId,
  friendships,
  onChanged
}: {
  currentUserId: string;
  friendships: any[];
  onChanged: () => void;
}) {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");

  async function addFriend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });
    const data = await res.json();
    setMessage(data.ok ? "好友请求已发送" : data.error);
    if (data.ok) {
      setUsername("");
      onChanged();
    }
  }

  async function act(id: string, action: "accept" | "reject") {
    const res = await fetch(`/api/friends/${id}/${action}`, { method: "POST" });
    const data = await res.json();
    setMessage(data.ok ? (action === "accept" ? "已接受好友请求" : "已删除好友请求") : data.error);
    if (data.ok) onChanged();
  }

  return (
    <section className="pet-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-black">好友</h2>
          <p className="mt-1 text-sm text-ink/60">添加好友后，你的宠物可以去好友家串门互动。</p>
        </div>
        <form className="flex gap-2" onSubmit={addFriend}>
          <input className="field min-w-0" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="好友用户名" />
          <button className="btn-primary whitespace-nowrap">添加</button>
        </form>
      </div>
      {message && <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold">{message}</p>}
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {friendships.length === 0 && <p className="text-sm text-ink/60">还没有好友。</p>}
        {friendships.map((item) => {
          const other = item.requesterId === currentUserId ? item.addressee : item.requester;
          const isIncoming = item.status === "pending" && item.addresseeId === currentUserId;
          return (
            <div key={item.id} className="rounded-lg bg-white px-3 py-2 text-sm">
              <div className="font-bold">{other.username}</div>
              <div className="text-ink/55">{item.status === "accepted" ? "已是好友" : "等待确认"}</div>
              {isIncoming && (
                <div className="mt-2 flex gap-2">
                  <button className="btn-primary px-3 py-1" onClick={() => act(item.id, "accept")}>接受</button>
                  <button className="btn-soft px-3 py-1" onClick={() => act(item.id, "reject")}>拒绝</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
