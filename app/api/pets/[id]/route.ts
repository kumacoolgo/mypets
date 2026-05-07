import { requireUser } from "@/lib/auth";
import { forbidden, notFound, ok } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { handleAuthError, touchPetState } from "@/lib/route-helpers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const pet = await touchPetState(id, user.role === "ADMIN" ? undefined : user.id);
    if (!pet) return user.role === "ADMIN" ? notFound("宠物不存在") : forbidden("不能访问别人的宠物");
    return ok({ pet });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const pet = await prisma.pet.findFirst({ where: { id, ownerId: user.id } });
    if (!pet) return notFound("宠物不存在");
    await prisma.pet.delete({ where: { id: pet.id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
