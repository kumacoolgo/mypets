import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  return (
    <section className="grid min-h-[70vh] items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="mb-3 text-sm font-bold text-berry">Web Tamagotchi for Zeabur</p>
        <h1 className="text-5xl font-black tracking-normal text-ink md:text-7xl">{process.env.NEXT_PUBLIC_APP_NAME || "MyPets"}</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-ink/75">
          领养一只会饿、会累、会开心的小宠物，喂食、玩耍、打工，还可以让 AI 生成可爱的互动小剧情。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {user ? (
            <>
              <Link className="btn-primary" href="/pets">
                进入我的宠物
              </Link>
              {user.role === "ADMIN" && (
                <Link className="btn-soft" href="/admin">
                  进入后台
                </Link>
              )}
            </>
          ) : (
            <>
              <Link className="btn-primary" href="/register">
                创建账号
              </Link>
              <Link className="btn-soft" href="/login">
                登录
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="pet-card p-8 text-center">
        <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-full bg-mint/20 text-8xl shadow-inner">🐱</div>
        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          {["饥饿 20", "心情 88", "体力 76", "清洁 91"].map((item) => (
            <div key={item} className="rounded-lg bg-white px-3 py-2 font-semibold text-ink/70">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
