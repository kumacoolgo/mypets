import { getCurrentUser } from "@/lib/auth";
import { ok } from "@/lib/api-response";
import { ensureBootstrap } from "@/lib/bootstrap";

export async function GET() {
  await ensureBootstrap();
  const user = await getCurrentUser();
  return ok({ user });
}
