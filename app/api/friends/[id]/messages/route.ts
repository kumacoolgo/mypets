import { badRequest, notFound, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleAuthError } from "@/lib/route-helpers";

async function findFriendship(id: string, userId: string) {
  return prisma.friendship.findFirst({
    where: {
      id,
      status: "accepted",
      OR: [{ requesterId: userId }, { addresseeId: userId }]
    }
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const friendship = await findFriendship(id, user.id);
    if (!friendship) return notFound("好友关系不存在");
    const messages = await prisma.friendMessage.findMany({
      where: { friendshipId: id },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { sender: { select: { id: true, username: true } } }
    });
    return ok({ messages });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const friendship = await findFriendship(id, user.id);
    if (!friendship) return notFound("好友关系不存在");
    const body = await request.json();
    const content = String(body.content || "").trim();
    if (!content) return badRequest("消息不能为空");
    if (content.length > 500) return badRequest("消息最多 500 字");
    const message = await prisma.friendMessage.create({
      data: { friendshipId: id, senderId: user.id, content },
      include: { sender: { select: { id: true, username: true } } }
    });
    return ok({ message }, 201);
  } catch (error) {
    return handleAuthError(error);
  }
}
