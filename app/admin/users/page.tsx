import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminUsersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { username: true, email: true, role: true, createdAt: true }
  });
  return (
    <div>
      <h1 className="mb-4 text-3xl font-black">用户列表</h1>
      <AdminNav />
      <div className="pet-card overflow-x-auto p-2">
        <table className="w-full text-left text-sm">
          <thead><tr className="text-ink/60"><th className="p-3">用户名</th><th>邮箱</th><th>角色</th><th>创建时间</th></tr></thead>
          <tbody>{users.map((user) => <tr key={user.username} className="border-t border-ink/10"><td className="p-3 font-bold">{user.username}</td><td>{user.email || "-"}</td><td>{user.role}</td><td>{user.createdAt.toLocaleString()}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
