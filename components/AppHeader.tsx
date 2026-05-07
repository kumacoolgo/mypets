import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import FriendDrawer from "@/components/FriendDrawer";

export default async function AppHeader() {
  const user = await getCurrentUser();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "MyPets";
  return (
    <header className="border-b border-white/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-black text-ink">
          {appName}
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link className="btn-soft px-3 py-1.5" href="/pets">
            我的宠物
          </Link>
          {user?.role === "ADMIN" && (
            <Link className="btn-soft px-3 py-1.5" href="/admin">
              后台
            </Link>
          )}
          {user ? (
            <>
              <FriendDrawer />
              <LogoutButton />
            </>
          ) : (
            <>
              <Link className="btn-soft px-3 py-1.5" href="/login">
                登录
              </Link>
              <Link className="btn-primary px-3 py-1.5" href="/register">
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
