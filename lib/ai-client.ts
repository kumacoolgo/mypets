import { getAiSettings } from "@/lib/settings";

export type ChatResult = {
  text: string;
  tokensUsed?: number;
};

export async function callOpenAICompatible(messages: Array<{ role: "system" | "user"; content: string }>, override?: { temperature?: number }) {
  const settings = await getAiSettings();
  if (!settings.enabled) throw new Error("AI 功能未启用或 API Key 未配置");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), settings.timeoutSeconds * 1000);
  try {
    const baseUrl = settings.baseUrl.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: settings.model,
        messages,
        temperature: override?.temperature ?? 0.8
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`AI 请求失败：${response.status} ${body.slice(0, 300)}`);
    }
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) throw new Error("AI 返回为空");
    return { text, tokensUsed: data?.usage?.total_tokens } as ChatResult;
  } finally {
    clearTimeout(timer);
  }
}
