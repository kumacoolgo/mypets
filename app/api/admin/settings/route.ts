import { ok, badRequest } from "@/lib/api-response";
import { adminOnly } from "@/lib/route-helpers";
import { isRegisterAllowed, setSetting, SETTING_KEYS } from "@/lib/settings";
import { adminSettingsSchema } from "@/lib/validators";

export async function GET() {
  return adminOnly(async () => ok({ allowRegister: await isRegisterAllowed() }));
}

export async function POST(request: Request) {
  return adminOnly(async () => {
    const parsed = adminSettingsSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "参数错误");
    await setSetting(SETTING_KEYS.allowRegister, String(parsed.data.allowRegister));
    return ok({ allowRegister: parsed.data.allowRegister });
  });
}
