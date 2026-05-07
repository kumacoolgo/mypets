import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import StatCard from "@/components/StatCard";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isRegisterAllowed } from "@/lib/settings";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }
  const [userCount, petCount, interactionCount, allowRegister] = await Promise.all([
    prisma.user.count(),
    prisma.pet.count(),
    prisma.interactionLog.count(),
    isRegisterAllowed()
  ]);
  return (
    <div>
      <h1 className="mb-4 text-3xl font-black">管理员后台</h1>
      <AdminNav />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="用户数量" value={userCount} />
        <StatCard label="宠物数量" value={petCount} />
        <StatCard label="互动数量" value={interactionCount} />
        <StatCard label="允许注册" value={allowRegister ? "开启" : "关闭"} />
      </div>
    </div>
  );
}
