import { prisma } from "@/lib/db";
import { badRequest, ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { handleAuthError } from "@/lib/route-helpers";
import { petCreateSchema } from "@/lib/validators";
import { calculateDecay } from "@/lib/pet-engine";
import { getAiSettings, publicAiSettings } from "@/lib/settings";

export async function GET() {
  try {
    const user = await requireUser();
    const pets = await prisma.pet.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "asc" },
      include: { logs: { orderBy: { createdAt: "desc" }, take: 8 } }
    });
    const updated = [];
    for (const pet of pets) {
      const decayed = calculateDecay(pet);
      updated.push(
        await prisma.pet.update({
          where: { id: pet.id },
          data: {
            hunger: decayed.hunger,
            mood: decayed.mood,
            energy: decayed.energy,
            cleanliness: decayed.cleanliness,
            status: decayed.status,
            lastStateUpdateAt: decayed.lastStateUpdateAt
          },
          include: { logs: { orderBy: { createdAt: "desc" }, take: 8 } }
        })
      );
    }
    const aiSettings = publicAiSettings(await getAiSettings());
    return ok({ pets: updated, aiSettings });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = petCreateSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "参数错误");
    const pet = await prisma.pet.create({
      data: { ownerId: user.id, name: parsed.data.name, type: parsed.data.type }
    });
    return ok({ pet }, 201);
  } catch (error) {
    return handleAuthError(error);
  }
}
