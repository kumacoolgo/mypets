"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [allowRegister, setAllowRegister] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/register")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setAllowRegister(data?.ok ? data.data.allowRegister : true))
      .catch(() => setAllowRegister(true));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmPassword")) {
      setError("两次输入的密码不一致");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        email: form.get("email"),
        password: form.get("password")
      })
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) return setError(data.error);
    router.push("/login");
  }

  return (
    <div className="mx-auto max-w-md pet-card p-6">
      <h1 className="text-2xl font-black">注册</h1>
      {allowRegister === false && <p className="mt-4 rounded-lg bg-honey/20 px-3 py-2 text-sm">管理员暂时关闭了新用户注册。</p>}
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <input className="field" name="username" placeholder="用户名，至少 3 位" disabled={allowRegister === false} />
        <input className="field" name="email" type="email" placeholder="邮箱，可选" disabled={allowRegister === false} />
        <input className="field" name="password" type="password" placeholder="密码，至少 8 位" disabled={allowRegister === false} />
        <input className="field" name="confirmPassword" type="password" placeholder="确认密码" disabled={allowRegister === false} />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading || allowRegister === false}>
          {loading ? "创建中..." : "创建账号"}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink/60">
        已有账号？<Link className="font-bold text-berry" href="/login">去登录</Link>
      </p>
    </div>
  );
}
