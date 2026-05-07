import { prisma } from "@/lib/db";

export const SETTING_KEYS = {
  allowRegister: "allow_register",
  aiEnabled: "ai_enabled",
  aiBaseUrl: "ai_base_url",
  aiModel: "ai_model",
  aiApiKey: "ai_api_key",
  aiTimeoutSeconds: "ai_timeout_seconds",
  aiDailyLimitPerUser: "ai_daily_limit_per_user",
  aiEventCooldownSeconds: "ai_event_cooldown_seconds"
} as const;

export type AiSettings = {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutSeconds: number;
  dailyLimitPerUser: number;
  cooldownSeconds: number;
  apiKeyConfigured: boolean;
  maskedApiKey: string;
};

export function parseBool(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export async function getSetting(key: string) {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  return setting?.value;
}

export async function setSetting(key: string, value: string) {
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
}

export async function isRegisterAllowed() {
  const value = await getSetting(SETTING_KEYS.allowRegister);
  return parseBool(value, parseBool(process.env.ALLOW_REGISTER, true));
}

export async function getAiSettings(): Promise<AiSettings> {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: Object.values(SETTING_KEYS) } }
  });
  const map = new Map(settings.map((item) => [item.key, item.value]));
  const apiKey = map.get(SETTING_KEYS.aiApiKey) ?? process.env.AI_API_KEY ?? "";
  const enabled = parseBool(map.get(SETTING_KEYS.aiEnabled), parseBool(process.env.AI_ENABLED, false)) && Boolean(apiKey);
  return {
    enabled,
    baseUrl: map.get(SETTING_KEYS.aiBaseUrl) ?? process.env.AI_BASE_URL ?? "https://api.openai.com/v1",
    apiKey,
    model: map.get(SETTING_KEYS.aiModel) ?? process.env.AI_MODEL ?? "gpt-4o-mini",
    timeoutSeconds: Number(map.get(SETTING_KEYS.aiTimeoutSeconds) ?? process.env.AI_TIMEOUT_SECONDS ?? 30),
    dailyLimitPerUser: Number(map.get(SETTING_KEYS.aiDailyLimitPerUser) ?? process.env.AI_DAILY_LIMIT_PER_USER ?? 20),
    cooldownSeconds: Number(map.get(SETTING_KEYS.aiEventCooldownSeconds) ?? process.env.AI_EVENT_COOLDOWN_SECONDS ?? 60),
    apiKeyConfigured: Boolean(apiKey),
    maskedApiKey: maskSecret(apiKey)
  };
}

export function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "****";
  return `${value.slice(0, 3)}-****${value.slice(-4)}`;
}

export function publicAiSettings(settings: AiSettings) {
  const { apiKey: _apiKey, ...safe } = settings;
  return safe;
}
