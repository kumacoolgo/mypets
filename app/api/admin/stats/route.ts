import { prisma } from "@/lib/db";
import { ok } from "@/lib/api-response";
import { adminOnly } from "@/lib/route-helpers";
import { isRegisterAllowed } from "@/lib/settings";

export async function GET() {
  return adminOnly(async () => {
    const [userCount, petCount, interactionCount, allowRegister] = await Promise.all([
      prisma.user.count(),
      prisma.pet.count(),
      prisma.interactionLog.count(),
      isRegisterAllowed()
    ]);
    return ok({ userCount, petCount, interactionCount, allowRegister });
  });
}
