import { prisma } from "@/lib/db";
import { ok } from "@/lib/api-response";
import { adminOnly } from "@/lib/route-helpers";

export async function GET() {
  return adminOnly(async () => {
    const logs = await prisma.aiEventLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { username: true } },
        pet: { select: { name: true, type: true } }
      }
    });
    return ok({ logs });
  });
}
