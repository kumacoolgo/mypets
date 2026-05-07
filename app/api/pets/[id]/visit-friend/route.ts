import { badRequest, notFound, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clamp, calculateDecay, determineStatus, normalizeProgress } from "@/lib/pet-engine";
import { handleAuthError } from "@/lib/route-helpers";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const targetPetId = String(body.targetPetId || "");
    if (!targetPetId) return badRequest("请选择要串门的好友宠物");

    const [pet, targetPet] = await Promise.all([
      prisma.pet.findFirst({ where: { id, ownerId: user.id } }),
      prisma.pet.findUnique({ where: { id: targetPetId }, include: { owner: { select: { id: true, username: true } } } })
    ]);
    if (!pet) return notFound("你的宠物不存在");
    if (!targetPet) return notFound("好友宠物不存在");
    if (targetPet.ownerId === user.id) return badRequest("不能去自己家串门");

    const friendship = await prisma.friendship.findFirst({
      where: {
        status: "accepted",
        OR: [
          { requesterId: user.id, addresseeId: targetPet.ownerId },
          { requesterId: targetPet.ownerId, addresseeId: user.id }
        ]
      }
    });
    if (!friendship) return badRequest("你们还不是好友，不能串门");

    const decayed = calculateDecay(pet);
    const progressed = normalizeProgress(decayed.level, decayed.exp + 12);
    const next = {
      level: progressed.level,
      exp: progressed.exp,
      hunger: clamp(decayed.hunger - 6),
      mood: clamp(decayed.mood + 12),
      energy: clamp(decayed.energy - 8),
      cleanliness: clamp(decayed.cleanliness - 3),
      status: "normal",
      lastStateUpdateAt: decayed.lastStateUpdateAt
    };
    next.status = determineStatus(next);

    const updated = await prisma.pet.update({
      where: { id: pet.id },
      data: next
    });
    const result = {
      title: "好友家串门",
      story: `${pet.name} 去 ${targetPet.owner.username} 家找 ${targetPet.name} 玩了一会儿，带着好心情回来了。`,
      expGain: 12,
      coinsGain: 0,
      levelUps: progressed.levelUps,
      deltas: { hunger: -6, mood: 12, energy: -8, cleanliness: -3 }
    };
    await prisma.interactionLog.create({
      data: {
        userId: user.id,
        petId: pet.id,
        action: "visit-friend",
        result: JSON.stringify(result)
      }
    });
    return ok({ pet: updated, result });
  } catch (error) {
    return handleAuthError(error);
  }
}
