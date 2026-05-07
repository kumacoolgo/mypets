import { badRequest, ok } from "@/lib/api-response";
import { callOpenAICompatible } from "@/lib/ai-client";
import { adminOnly } from "@/lib/route-helpers";
import { getAiSettings } from "@/lib/settings";

export async function POST() {
  return adminOnly(async () => {
    try {
      const settings = await getAiSettings();
      const result = await callOpenAICompatible([
        { role: "system", content: "你只返回 JSON，不要 Markdown。" },
        { role: "user", content: '{"task":"reply with {\\"ok\\":true,\\"message\\":\\"pong\\"}"}' }
      ], { temperature: 0 });
      return ok({ message: "AI connection ok", model: settings.model, response: result.text.slice(0, 500) });
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : "AI 测试失败");
    }
  });
}
