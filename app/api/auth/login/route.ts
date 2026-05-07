import { prisma } from "@/lib/db";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api-response";
import { setAuthCookie, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { ensureBootstrap } from "@/lib/bootstrap";

export async function POST(request: Request) {
  try {
    await ensureBootstrap();
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "参数错误");
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: parsed.data.usernameOrEmail }, { email: parsed.data.usernameOrEmail }]
      }
    });
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return unauthorized("用户名或密码错误");
    }
    await setAuthCookie({ id: user.id, username: user.username, role: user.role });
    return ok({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "登录失败");
  }
}
