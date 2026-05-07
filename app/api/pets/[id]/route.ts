import { requireUser } from "@/lib/auth";
import { forbidden, notFound, ok } from "@/lib/api-response";
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
