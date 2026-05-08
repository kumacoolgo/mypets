"use client";

import { useEffect, useMemo, useState } from "react";

type Friendship = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: string;
  requester: { id: string; username: string };
  addressee: { id: string; username: string };
};

export default function FriendDrawer() {
  const [open, setOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [friendPets, setFriendPets] = useState<any[]>([]);
  const [ownPets, setOwnPets] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [newFriend, setNewFriend] = useState("");
  const [content, setContent] = useState("");
  const [ownPetId, setOwnPetId] = useState("");
  const [targetPetId, setTargetPetId] = useState("");
  const [notice, setNotice] = useState("");

  const accepted = useMemo(() => friendships.filter((item) => item.status === "accepted"), [friendships]);
  const pendingIncoming = useMemo(
    () => friendships.filter((item) => item.status === "pending" && item.addresseeId === currentUserId),
    [friendships, currentUserId]
  );
  const selected = accepted.find((item) => item.id === selectedId);
  const selectedFriend = selected ? (selected.requesterId === currentUserId ? selected.addressee : selected.requester) : null;
  const selectedFriendPets = selectedFriend ? friendPets.filter((pet) => pet.ownerId === selectedFriend.id) : [];

  async function load() {
    const [friendsRes, petsRes] = await Promise.all([fetch("/api/friends"), fetch("/api/pets")]);
    const friendData = await friendsRes.json();
    const petData = await petsRes.json();
    if (friendData.ok) {
      setCurrentUserId(friendData.data.currentUserId);
      setFriendships(friendData.data.friendships);
      setFriendPets(friendData.data.friendPets);
      if (!selectedId && friendData.data.friendships.length > 0) {
        const firstAccepted = friendData.data.friendships.find((item: Friendship) => item.status === "accepted");
        if (firstAccepted) setSelectedId(firstAccepted.id);
      }
    }
    if (petData.ok) setOwnPets(petData.data.pets);
  }

  async function loadMessages(friendshipId: string) {
    if (!friendshipId) return setMessages([]);
    const res = await fetch(`/api/friends/${friendshipId}/messages`);
    const data = await res.json();
    setMessages(data.ok ? data.data.messages : []);
  }

  useEffect(() => {
    if (open) load();
  }, [open]);

  useEffect(() => {
    if (open && selectedId) loadMessages(selectedId);
  }, [open, selectedId]);

  async function addFriend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newFriend })
    });
    const data = await res.json();
    setNotice(data.ok ? "好友请求已发送" : data.error);
    if (data.ok) {
      setNewFriend("");
      load();
    }
  }

  async function accept(id: string) {
    const res = await fetch(`/api/friends/${id}/accept`, { method: "POST" });
    const data = await res.json();
    setNotice(data.ok ? "已接受好友请求" : data.error);
    if (data.ok) load();
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    const res = await fetch(`/api/friends/${selectedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    const data = await res.json();
    setNotice(data.ok ? "" : data.error);
    if (data.ok) {
      setContent("");
      loadMessages(selectedId);
    }
  }

  async function visitFriendPet() {
    if (!ownPetId || !targetPetId) {
      setNotice("请选择自己的宠物和好友宠物");
      return;
    }
    const res = await fetch(`/api/pets/${ownPetId}/visit-friend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetPetId })
    });
    const data = await res.json();
    setNotice(data.ok ? data.data.result.story : data.error);
  }

  return (
    <div className="relative">
      <button className="btn-soft px-3 py-1.5" type="button" onClick={() => setOpen(true)}>
        好友
      </button>
      {open && (
        <div className="fixed right-4 top-20 z-[9999] flex h-[min(74vh,640px)] w-[min(92vw,390px)] flex-col overflow-hidden rounded-lg border border-ink/10 bg-white shadow-2xl md:right-[calc((100vw-72rem)/2+1rem)]">
          <div className="flex items-center justify-between border-b border-ink/10 bg-mint/10 px-4 py-3">
            <div>
              <h2 className="text-base font-black">好友</h2>
              <p className="text-xs text-ink/55">聊天和宠物串门</p>
            </div>
            <button className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-ink ring-1 ring-ink/10" type="button" onClick={() => setOpen(false)}>
              关闭
            </button>
          </div>

          <div className="border-b border-ink/10 p-3">
            <form className="flex gap-2" onSubmit={addFriend}>
              <input className="field h-10 min-w-0 text-sm" value={newFriend} onChange={(e) => setNewFriend(e.target.value)} placeholder="好友用户名" />
              <button className="btn-primary h-10 px-3">添加</button>
            </form>
            {notice && <p className="mt-2 rounded-lg bg-honey/15 px-3 py-2 text-xs font-semibold">{notice}</p>}
          </div>

          <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr]">
            <section className="max-h-40 overflow-y-auto border-b border-ink/10 p-3">
              {pendingIncoming.length > 0 && (
                <div className="mb-3 space-y-2">
                  <div className="text-[11px] font-black text-ink/45">待确认</div>
                  {pendingIncoming.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-honey/15 px-2 py-2 text-sm">
                      <span className="font-bold">{item.requester.username}</span>
                      <button className="rounded-lg bg-white px-2 py-1 text-xs font-bold" onClick={() => accept(item.id)}>
                        接受
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <div className="mb-2 text-[11px] font-black text-ink/45">好友列表</div>
                {accepted.length === 0 && <p className="text-sm text-ink/55">还没有好友。</p>}
                <div className="space-y-1">
                  {accepted.map((item) => {
                    const other = item.requesterId === currentUserId ? item.addressee : item.requester;
                    return (
                      <button
                        key={item.id}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold ${
                          selectedId === item.id ? "bg-mint/20 text-ink" : "bg-ink/5 text-ink/75"
                        }`}
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs ring-1 ring-ink/10">
                          {other.username.slice(0, 1).toUpperCase()}
                        </span>
                        <span>{other.username}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="flex min-h-0 flex-col p-3">
              {selectedFriend ? (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black">和 {selectedFriend.username}</h3>
                      <p className="text-xs text-ink/50">聊天，也可以访问 TA 家宠物</p>
                    </div>
                  </div>
                  <div className="mb-3 rounded-lg bg-mint/10 p-2">
                    <div className="mb-2 text-xs font-black">访问好友宠物</div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <select className="field" value={ownPetId} onChange={(e) => setOwnPetId(e.target.value)}>
                          <option value="">你的宠物</option>
                          {ownPets.map((pet) => (
                            <option key={pet.id} value={pet.id}>
                              {pet.name}
                            </option>
                          ))}
                        </select>
                        <select className="field" value={targetPetId} onChange={(e) => setTargetPetId(e.target.value)}>
                          <option value="">好友宠物</option>
                          {selectedFriendPets.map((pet) => (
                            <option key={pet.id} value={pet.id}>
                              {pet.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button className="btn-primary h-9" type="button" onClick={visitFriendPet}>
                        访问
                      </button>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg bg-ink/5 p-3">
                    {messages.length === 0 && <p className="text-sm text-ink/55">还没有聊天消息。</p>}
                    {messages.map((message) => {
                      const mine = message.senderId === currentUserId;
                      return (
                        <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[82%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-berry text-white" : "bg-white"}`}>
                            <div>{message.content}</div>
                            <div className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-ink/40"}`}>
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <form className="mt-3 flex gap-2" onSubmit={sendMessage}>
                    <input className="field h-10" value={content} onChange={(e) => setContent(e.target.value)} placeholder="输入聊天内容" />
                    <button className="btn-primary h-10 whitespace-nowrap px-3">发送</button>
                  </form>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink/55">选择一个好友开始聊天。</div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
