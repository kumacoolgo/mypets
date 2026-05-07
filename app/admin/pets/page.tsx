import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminPetsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }
  const pets = await prisma.pet.findMany({
    orderBy: { updatedAt: "desc" },
    include: { owner: { select: { username: true } } }
  });
  return (
    <div>
      <h1 className="mb-4 text-3xl font-black">宠物列表</h1>
      <AdminNav />
      <div className="pet-card overflow-x-auto p-2">
        <table className="w-full text-left text-sm">
          <thead><tr className="text-ink/60"><th className="p-3">宠物名</th><th>类型</th><th>主人</th><th>等级</th><th>状态</th><th>更新时间</th></tr></thead>
          <tbody>{pets.map((pet) => <tr key={pet.id} className="border-t border-ink/10"><td className="p-3 font-bold">{pet.name}</td><td>{pet.type}</td><td>{pet.owner.username}</td><td>{pet.level}</td><td>{pet.status}</td><td>{pet.updatedAt.toLocaleString()}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
