import { prisma } from "@/lib/db";
import { authErrorResponse, requireAdmin, requireUser } from "@/lib/auth";
import { badRequest, forbidden, notFound, ok, serverError, unauthorized } from "@/lib/api-response";
import { applyPetAction, type PetAction } from "@/lib/pet-engine";
import {
  applyAiEventToPet,
  assertAiPreconditions,
  fallbackEvent,
  generateAiPetEvent,
  type AiEventType
} from "@/lib/ai-pet-engine";
import { getAiSettings } from "@/lib/settings";

export function handleAuthError(error: unknown) {
  const kind = authErrorResponse(error);
  if (kind === "UNAUTHORIZED") return unauthorized();
  if (kind === "FORBIDDEN") return forbidden();
  return serverError(error instanceof Error ? error.message : "服务器错误");
}

export async function touchPetState(petId: string, ownerId?: string) {
  const pet = await prisma.pet.findFirst({
    where: { id: petId, ...(ownerId ? { ownerId } : {}) }
  });
  if (!pet) return null;
  const { calculateDecay } = await import("@/lib/pet-engine");
  const decayed = calculateDecay(pet);
  return prisma.pet.update({
    where: { id: pet.id },
    data: {
      hunger: decayed.hunger,
      mood: decayed.mood,
      energy: decayed.energy,
      cleanliness: decayed.cleanliness,
      status: decayed.status,
      lastStateUpdateAt: decayed.lastStateUpdateAt
    }
  });
}

export async function petActionRoute(petId: string, action: PetAction) {
  try {
    const user = await requireUser();
    const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: user.id } });
    if (!pet) return notFound("宠物不存在");
    const applied = applyPetAction(pet, action);
    const updated = await prisma.pet.update({
      where: { id: pet.id },
      data: {
        level: applied.pet.level,
        exp: applied.pet.exp,
        coins: applied.pet.coins,
        hunger: applied.pet.hunger,
        mood: applied.pet.mood,
        energy: applied.pet.energy,
        cleanliness: applied.pet.cleanliness,
        status: applied.pet.status,
        lastStateUpdateAt: applied.pet.lastStateUpdateAt
      }
    });
    const log = await prisma.interactionLog.create({
      data: { userId: user.id, petId: pet.id, action, result: JSON.stringify(applied.result) }
    });
    return ok({ pet: updated, result: applied.result, log });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function aiPetActionRoute(petId: string, eventType: AiEventType) {
  let prompt = "";
  let rawResponse = "";
  let parsedJson: string | undefined;
  let success = false;
  let errorMessage: string | undefined;
  let tokensUsed: number | undefined;
  try {
    const user = await requireUser();
    const settings = await getAiSettings();
    if (!settings.enabled) return badRequest("AI 互动未启用或 API Key 未配置");

    const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: user.id } });
    if (!pet) return notFound("宠物不存在");
    const currentPet = await touchPetState(pet.id, user.id);
    if (!currentPet) return notFound("宠物不存在");

    const precondition = assertAiPreconditions(eventType, currentPet);
    if (precondition) return badRequest(precondition);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.aiEventLog.count({
      where: { userId: user.id, createdAt: { gte: today } }
    });
    if (todayCount >= settings.dailyLimitPerUser) return badRequest("今天的 AI 互动次数已用完");

    const lastEvent = await prisma.aiEventLog.findFirst({
      where: { petId: currentPet.id },
      orderBy: { createdAt: "desc" }
    });
    if (lastEvent && settings.cooldownSeconds > 0) {
      const elapsed = Math.floor((Date.now() - lastEvent.createdAt.getTime()) / 1000);
      if (elapsed < settings.cooldownSeconds) {
        return badRequest(`AI 互动冷却中，还需等待 ${settings.cooldownSeconds - elapsed} 秒`);
      }
    }

    let event;
    try {
      const generated = await generateAiPetEvent(eventType, currentPet);
      event = generated.event;
      prompt = generated.prompt;
      rawResponse = generated.text;
      parsedJson = JSON.stringify(event);
      tokensUsed = generated.tokensUsed;
      success = true;
    } catch (error) {
      event = fallbackEvent(eventType);
      prompt = JSON.stringify({ eventType, petId: currentPet.id });
      rawResponse = JSON.stringify(event);
      parsedJson = JSON.stringify(event);
      errorMessage = error instanceof Error ? error.message : "AI 调用失败";
    }

    const applied = applyAiEventToPet(currentPet, event);
    const updated = await prisma.pet.update({
      where: { id: currentPet.id },
      data: {
        level: applied.pet.level,
        exp: applied.pet.exp,
        coins: applied.pet.coins,
        hunger: applied.pet.hunger,
        mood: applied.pet.mood,
        energy: applied.pet.energy,
        cleanliness: applied.pet.cleanliness,
        status: applied.pet.status,
        lastStateUpdateAt: applied.pet.lastStateUpdateAt
      }
    });
    const aiLog = await prisma.aiEventLog.create({
      data: {
        userId: user.id,
        petId: currentPet.id,
        eventType,
        prompt,
        response: rawResponse,
        parsedJson,
        success,
        error: errorMessage,
        tokensUsed
      }
    });
    await prisma.interactionLog.create({
      data: {
        userId: user.id,
        petId: currentPet.id,
        action: eventType,
        result: JSON.stringify({ ...applied.result, fallback: !success, aiLogId: aiLog.id })
      }
    });
    return ok({ pet: updated, result: { ...applied.result, fallback: !success } });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function adminOnly<T>(fn: () => Promise<T>) {
  try {
    await requireAdmin();
    return await fn();
  } catch (error) {
    return handleAuthError(error);
  }
}
