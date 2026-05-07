"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

export default function AdminSettingsPage() {
  const [allowRegister, setAllowRegister] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => data.ok && setAllowRegister(data.data.allowRegister));
  }, []);

  async function save() {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allowRegister })
    });
    const data = await res.json();
    setMessage(data.ok ? "已保存" : data.error);
  }

  return (
    <div>
      <h1 className="mb-4 text-3xl font-black">系统设置</h1>
      <AdminNav />
      <section className="pet-card max-w-xl p-5">
        <label className="flex items-center gap-3 font-bold">
          <input type="checkbox" checked={allowRegister} onChange={(e) => setAllowRegister(e.target.checked)} />
          允许普通用户注册
        </label>
        <button className="btn-primary mt-4" onClick={save}>保存设置</button>
        {message && <p className="mt-3 text-sm text-ink/60">{message}</p>}
      </section>
    </div>
  );
}
