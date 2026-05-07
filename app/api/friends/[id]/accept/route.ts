import { notFound, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleAuthError } from "@/lib/route-helpers";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const friendship = await prisma.friendship.findFirst({
      where: { id, addresseeId: user.id, status: "pending" }
    });
    if (!friendship) return notFound("好友请求不存在");
    const updated = await prisma.friendship.update({
      where: { id },
      data: { status: "accepted" }
    });
    return ok({ friendship: updated });
  } catch (error) {
    return handleAuthError(error);
  }
}
