import { badRequest, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleAuthError } from "@/lib/route-helpers";

function pairWhere(userId: string) {
  return {
    OR: [{ requesterId: userId }, { addresseeId: userId }]
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    const friendships = await prisma.friendship.findMany({
      where: pairWhere(user.id),
      orderBy: { updatedAt: "desc" },
      include: {
        requester: { select: { id: true, username: true } },
        addressee: { select: { id: true, username: true } }
      }
    });
    const acceptedUserIds = friendships
      .filter((item) => item.status === "accepted")
      .map((item) => (item.requesterId === user.id ? item.addresseeId : item.requesterId));
    const friendPets = acceptedUserIds.length
      ? await prisma.pet.findMany({
          where: { ownerId: { in: acceptedUserIds } },
          orderBy: { updatedAt: "desc" },
          include: { owner: { select: { id: true, username: true } } }
        })
      : [];
    return ok({ currentUserId: user.id, friendships, friendPets });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const username = String(body.username || "").trim();
    if (!username) return badRequest("请输入好友用户名");
    const target = await prisma.user.findUnique({ where: { username }, select: { id: true, username: true } });
    if (!target) return badRequest("用户不存在");
    if (target.id === user.id) return badRequest("不能添加自己为好友");

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: user.id, addresseeId: target.id },
          { requesterId: target.id, addresseeId: user.id }
        ]
      }
    });
    if (existing) return badRequest(existing.status === "accepted" ? "你们已经是好友了" : "好友请求已存在");

    const friendship = await prisma.friendship.create({
      data: { requesterId: user.id, addresseeId: target.id, status: "pending" }
    });
    return ok({ friendship }, 201);
  } catch (error) {
    return handleAuthError(error);
  }
}
