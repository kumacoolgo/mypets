import { notFound, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleAuthError } from "@/lib/route-helpers";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const friendship = await prisma.friendship.findFirst({
      where: {
        id,
        OR: [{ requesterId: user.id }, { addresseeId: user.id }]
      }
    });
    if (!friendship) return notFound("好友关系不存在");
    await prisma.friendship.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
