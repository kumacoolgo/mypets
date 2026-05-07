import { prisma } from "@/lib/db";
import { ok } from "@/lib/api-response";
import { adminOnly } from "@/lib/route-helpers";

export async function GET() {
  return adminOnly(async () => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, username: true, email: true, role: true, createdAt: true, updatedAt: true }
    });
    return ok({ users });
  });
}
