import { badRequest, ok } from "@/lib/api-response";
import { adminOnly } from "@/lib/route-helpers";
import { getAiSettings, publicAiSettings, setSetting, SETTING_KEYS } from "@/lib/settings";
import { aiSettingsSchema } from "@/lib/validators";

export async function GET() {
  return adminOnly(async () => ok(publicAiSettings(await getAiSettings())));
}

export async function POST(request: Request) {
  return adminOnly(async () => {
    const parsed = aiSettingsSchema.safeParse(await request.json());
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "参数错误");
    await Promise.all([
      setSetting(SETTING_KEYS.aiEnabled, String(parsed.data.aiEnabled)),
      setSetting(SETTING_KEYS.aiBaseUrl, parsed.data.aiBaseUrl),
      setSetting(SETTING_KEYS.aiModel, parsed.data.aiModel),
      setSetting(SETTING_KEYS.aiTimeoutSeconds, String(parsed.data.aiTimeoutSeconds)),
      setSetting(SETTING_KEYS.aiDailyLimitPerUser, String(parsed.data.aiDailyLimitPerUser)),
      setSetting(SETTING_KEYS.aiEventCooldownSeconds, String(parsed.data.aiEventCooldownSeconds)),
      parsed.data.aiApiKey ? setSetting(SETTING_KEYS.aiApiKey, parsed.data.aiApiKey) : Promise.resolve()
    ]);
    return ok(publicAiSettings(await getAiSettings()));
  });
}
