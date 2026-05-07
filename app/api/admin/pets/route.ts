import { prisma } from "@/lib/db";
import { ok } from "@/lib/api-response";
import { adminOnly } from "@/lib/route-helpers";

export async function GET() {
  return adminOnly(async () => {
    const pets = await prisma.pet.findMany({
      orderBy: { updatedAt: "desc" },
      include: { owner: { select: { username: true, email: true } } }
    });
    return ok({ pets });
  });
}
