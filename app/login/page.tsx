"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernameOrEmail: form.get("usernameOrEmail"),
        password: form.get("password")
      })
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) return setError(data.error);
    router.push("/pets");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md pet-card p-6">
      <h1 className="text-2xl font-black">登录</h1>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <input className="field" name="usernameOrEmail" placeholder="用户名或邮箱" />
        <input className="field" name="password" type="password" placeholder="密码" />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "登录中..." : "登录"}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink/60">
        还没有账号？<Link className="font-bold text-berry" href="/register">去注册</Link>
      </p>
    </div>
  );
}
