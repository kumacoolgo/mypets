import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function upsertSetting(key: string, value: string) {
  const exists = await prisma.systemSetting.findUnique({ where: { key } });
  if (!exists) {
    await prisma.systemSetting.create({ data: { key, value } });
    console.log(`Created setting ${key}`);
  }
}

async function main() {
  required("DATABASE_URL");
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "change_me_please";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const sessionSecret = required("SESSION_SECRET");

  if (process.env.NODE_ENV === "production" && sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters in production");
  }
  if (adminPassword === "change_me_please") {
    console.warn("WARNING: default ADMIN_PASSWORD is in use. Change it before production traffic.");
  }

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount === 0) {
    await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: "ADMIN"
      }
    });
    console.log(`Created admin user: ${adminUsername}`);
  } else {
    console.log("Admin user already exists, skipping creation.");
  }

  await upsertSetting("allow_register", process.env.ALLOW_REGISTER ?? "true");
  await upsertSetting("ai_enabled", process.env.AI_ENABLED ?? "false");
  await upsertSetting("ai_base_url", process.env.AI_BASE_URL ?? "https://api.openai.com/v1");
  await upsertSetting("ai_model", process.env.AI_MODEL ?? "gpt-4o-mini");
  await upsertSetting("ai_timeout_seconds", process.env.AI_TIMEOUT_SECONDS ?? "30");
  await upsertSetting("ai_daily_limit_per_user", process.env.AI_DAILY_LIMIT_PER_USER ?? "20");
  await upsertSetting("ai_event_cooldown_seconds", process.env.AI_EVENT_COOLDOWN_SECONDS ?? "60");
  if (process.env.AI_API_KEY && process.env.AI_API_KEY !== "change_me_ai_api_key") {
    await upsertSetting("ai_api_key", process.env.AI_API_KEY);
  }

  console.log("Bootstrap finished.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
