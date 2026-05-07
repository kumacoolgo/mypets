import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SETTING_KEYS, setSetting } from "@/lib/settings";

export async function ensureBootstrap() {
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount === 0) {
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "change_me_please";
    const email = process.env.ADMIN_EMAIL || "admin@example.com";
    await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: await hashPassword(password),
        role: "ADMIN"
      }
    });
  }

  const allowRegister = await prisma.systemSetting.findUnique({
    where: { key: SETTING_KEYS.allowRegister }
  });
  if (!allowRegister) {
    await setSetting(SETTING_KEYS.allowRegister, process.env.ALLOW_REGISTER ?? "true");
  }

  const aiDefaults: Array<[string, string | undefined]> = [
    [SETTING_KEYS.aiEnabled, process.env.AI_ENABLED ?? "false"],
    [SETTING_KEYS.aiBaseUrl, process.env.AI_BASE_URL ?? "https://api.openai.com/v1"],
    [SETTING_KEYS.aiModel, process.env.AI_MODEL ?? "gpt-4o-mini"],
    [SETTING_KEYS.aiTimeoutSeconds, process.env.AI_TIMEOUT_SECONDS ?? "30"],
    [SETTING_KEYS.aiDailyLimitPerUser, process.env.AI_DAILY_LIMIT_PER_USER ?? "20"],
    [SETTING_KEYS.aiEventCooldownSeconds, process.env.AI_EVENT_COOLDOWN_SECONDS ?? "60"]
  ];
  for (const [key, value] of aiDefaults) {
    const exists = await prisma.systemSetting.findUnique({ where: { key } });
    if (!exists && value !== undefined) await setSetting(key, value);
  }
}
