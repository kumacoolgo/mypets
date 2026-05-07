import { prisma } from "@/lib/db";
import { badRequest, ok, serverError } from "@/lib/api-response";
import { hashPassword } from "@/lib/auth";
import { isRegisterAllowed } from "@/lib/settings";
import { registerSchema } from "@/lib/validators";
import { ensureBootstrap } from "@/lib/bootstrap";

export async function GET() {
  await ensureBootstrap();
  return ok({ allowRegister: await isRegisterAllowed() });
}

export async function POST(request: Request) {
  try {
    await ensureBootstrap();
    if (!(await isRegisterAllowed())) return badRequest("当前暂不开放注册");
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "参数错误");
    const exists = await prisma.user.findFirst({
      where: { OR: [{ username: parsed.data.username }, ...(parsed.data.email ? [{ email: parsed.data.email }] : [])] }
    });
    if (exists) return badRequest("用户名或邮箱已被使用");
    const user = await prisma.user.create({
      data: {
        username: parsed.data.username,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password)
      },
      select: { id: true, username: true, email: true, role: true, createdAt: true }
    });
    return ok({ user }, 201);
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "注册失败");
  }
}
