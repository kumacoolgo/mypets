import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().trim().min(3, "用户名至少 3 位").max(32, "用户名过长"),
  email: z
    .string()
    .trim()
    .email("邮箱格式不正确")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  password: z.string().min(8, "密码至少 8 位")
});

export const loginSchema = z.object({
  usernameOrEmail: z.string().trim().min(1, "请输入用户名或邮箱"),
  password: z.string().min(1, "请输入密码")
});

export const petCreateSchema = z.object({
  name: z.string().trim().min(1, "宠物名字不能为空").max(30, "宠物名字最多 30 位"),
  type: z.enum(["cat", "dog", "slime", "robot", "bird"])
});

export const adminSettingsSchema = z.object({
  allowRegister: z.boolean()
});

export const aiSettingsSchema = z.object({
  aiEnabled: z.boolean(),
  aiBaseUrl: z.string().trim().url("AI Base URL 格式不正确"),
  aiModel: z.string().trim().min(1, "AI Model 不能为空"),
  aiApiKey: z.string().optional(),
  aiTimeoutSeconds: z.coerce.number().int().min(5).max(120),
  aiDailyLimitPerUser: z.coerce.number().int().min(1).max(500),
  aiEventCooldownSeconds: z.coerce.number().int().min(0).max(3600)
});
