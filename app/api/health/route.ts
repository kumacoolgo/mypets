import { ok } from "@/lib/api-response";
import { ensureBootstrap } from "@/lib/bootstrap";

export async function GET() {
  await ensureBootstrap();
  return ok({ ok: true, app: "mypets", time: new Date().toISOString() });
}
