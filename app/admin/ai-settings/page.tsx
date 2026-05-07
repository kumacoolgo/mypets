"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";

export default function AiSettingsPage() {
  const [form, setForm] = useState<any>({
    aiEnabled: false,
    aiBaseUrl: "https://api.openai.com/v1",
    aiModel: "gpt-4o-mini",
    aiTimeoutSeconds: 30,
    aiDailyLimitPerUser: 20,
    aiEventCooldownSeconds: 60,
    aiApiKey: ""
  });
  const [masked, setMasked] = useState("");
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState<any[]>([]);

  async function load() {
    const [settingsRes, logsRes] = await Promise.all([fetch("/api/admin/ai-settings"), fetch("/api/admin/ai-logs")]);
    const settings = await settingsRes.json();
    const logsData = await logsRes.json();
    if (settings.ok) {
      setForm({
        aiEnabled: settings.data.enabled,
        aiBaseUrl: settings.data.baseUrl,
        aiModel: settings.data.model,
        aiTimeoutSeconds: settings.data.timeoutSeconds,
        aiDailyLimitPerUser: settings.data.dailyLimitPerUser,
        aiEventCooldownSeconds: settings.data.cooldownSeconds,
        aiApiKey: ""
      });
      setMasked(settings.data.maskedApiKey || "");
    }
    if (logsData.ok) setLogs(logsData.data.logs);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    const res = await fetch("/api/admin/ai-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setMessage(data.ok ? "AI 设置已保存" : data.error);
    if (data.ok) load();
  }

  async function test() {
    setMessage("正在测试 AI 连接...");
    const res = await fetch("/api/admin/ai-settings/test", { method: "POST" });
    const data = await res.json();
    setMessage(data.ok ? `${data.data.message}: ${data.data.response}` : data.error);
  }

  function update(key: string, value: any) {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <h1 className="mb-4 text-3xl font-black">AI 设置</h1>
      <AdminNav />
      <section className="pet-card max-w-2xl space-y-4 p-5">
        <label className="flex items-center gap-3 font-bold">
          <input type="checkbox" checked={form.aiEnabled} onChange={(e) => update("aiEnabled", e.target.checked)} />
          开启 AI 互动
        </label>
        <input className="field" value={form.aiBaseUrl} onChange={(e) => update("aiBaseUrl", e.target.value)} placeholder="AI Base URL" />
        <input className="field" value={form.aiModel} onChange={(e) => update("aiModel", e.target.value)} placeholder="AI Model" />
        <input className="field" value={form.aiApiKey} onChange={(e) => update("aiApiKey", e.target.value)} placeholder={masked ? `API Key 已配置：${masked}` : "AI API Key"} />
        <div className="grid gap-3 md:grid-cols-3">
          <input className="field" type="number" value={form.aiTimeoutSeconds} onChange={(e) => update("aiTimeoutSeconds", Number(e.target.value))} />
          <input className="field" type="number" value={form.aiDailyLimitPerUser} onChange={(e) => update("aiDailyLimitPerUser", Number(e.target.value))} />
          <input className="field" type="number" value={form.aiEventCooldownSeconds} onChange={(e) => update("aiEventCooldownSeconds", Number(e.target.value))} />
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={save}>保存</button>
          <button className="btn-soft" onClick={test}>测试连接</button>
        </div>
        {message && <p className="rounded-lg bg-white p-3 text-sm">{message}</p>}
      </section>
      <section className="mt-6 pet-card p-5">
        <h2 className="font-black">最近 AI 调用日志</h2>
        <div className="mt-3 space-y-2 text-sm">
          {logs.slice(0, 10).map((log) => (
            <div key={log.id} className="rounded-lg bg-white p-3">
              <div className="font-bold">{log.eventType} · {log.pet?.name} · {log.success ? "成功" : "fallback"}</div>
              <div className="text-ink/60">{log.error || log.response.slice(0, 120)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
