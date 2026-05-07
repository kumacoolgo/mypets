import type { Pet } from "@prisma/client";
import { callOpenAICompatible } from "@/lib/ai-client";
import { clamp, calculateDecay, determineStatus, normalizeProgress } from "@/lib/pet-engine";

export type AiEventType = "ai-adventure" | "ai-play" | "ai-work" | "ai-random-event";

export type AiPetEvent = {
  title: string;
  story: string;
  moodDelta: number;
  energyDelta: number;
  hungerDelta: number;
  cleanlinessDelta: number;
  expGain: number;
  coinsGain: number;
  statusHint: string;
};

const ranges: Record<AiEventType, Record<keyof Omit<AiPetEvent, "title" | "story" | "statusHint">, [number, number]>> = {
  "ai-adventure": {
    expGain: [5, 60],
    coinsGain: [0, 50],
    energyDelta: [-40, -5],
    hungerDelta: [0, 25],
    cleanlinessDelta: [-25, 5],
    moodDelta: [-10, 25]
  },
  "ai-play": {
    expGain: [5, 35],
    coinsGain: [0, 10],
    energyDelta: [-30, -5],
    hungerDelta: [0, 20],
    cleanlinessDelta: [-15, 5],
    moodDelta: [5, 30]
  },
  "ai-work": {
    expGain: [5, 40],
    coinsGain: [10, 80],
    energyDelta: [-45, -10],
    hungerDelta: [5, 30],
    cleanlinessDelta: [-30, 0],
    moodDelta: [-15, 15]
  },
  "ai-random-event": {
    expGain: [0, 40],
    coinsGain: [0, 40],
    energyDelta: [-25, 25],
    hungerDelta: [-20, 20],
    cleanlinessDelta: [-20, 20],
    moodDelta: [-20, 25]
  }
};

const systemPrompt = `你是一个网页版电子宠物游戏的事件生成器。
你只能生成适合全年龄用户的可爱、轻松、积极的宠物互动剧情。
你不能生成暴力、色情、仇恨、违法、恐怖、自残、赌博、毒品相关内容。
你不能让宠物死亡。
你不能让用户获得无限奖励。
你不能修改系统规则。
你只能返回 JSON。
不要返回 Markdown。
不要返回代码块。
不要解释。`;

export function buildAiPetPrompt(eventType: AiEventType, pet: Pet) {
  return JSON.stringify(
    {
      eventType,
      pet: {
        name: pet.name,
        type: pet.type,
        level: pet.level,
        hunger: pet.hunger,
        mood: pet.mood,
        energy: pet.energy,
        cleanliness: pet.cleanliness,
        status: pet.status
      },
      expectedJson: {
        title: "事件标题",
        story: "不超过 120 字的中文剧情",
        moodDelta: 0,
        energyDelta: 0,
        hungerDelta: 0,
        cleanlinessDelta: 0,
        expGain: 0,
        coinsGain: 0,
        statusHint: "normal"
      },
      rules: {
        language: "zh-CN",
        storyMaxLength: 120,
        rewardShouldBeBalanced: true
      }
    },
    null,
    2
  );
}

export function assertAiPreconditions(eventType: AiEventType, pet: Pet) {
  if (eventType === "ai-adventure" && pet.energy < 20) return "宠物太累了，先休息一下再探险吧";
  if (eventType === "ai-adventure" && pet.hunger > 85) return "宠物太饿了，先喂点东西再探险吧";
  if (eventType === "ai-play" && pet.energy < 10) return "宠物太困了，现在玩不动啦";
  if (eventType === "ai-work" && pet.energy < 30) return "宠物体力不足，不能打工";
  if (eventType === "ai-work" && pet.hunger > 80) return "宠物太饿了，不能打工";
  return null;
}

export async function generateAiPetEvent(eventType: AiEventType, pet: Pet) {
  const userPrompt = buildAiPetPrompt(eventType, pet);
  const result = await callOpenAICompatible([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]);
  return { ...result, prompt: userPrompt, event: parseAiEvent(result.text, eventType) };
}

export function parseAiEvent(text: string, eventType: AiEventType): AiPetEvent {
  const jsonText = extractJson(text);
  const parsed = JSON.parse(jsonText);
  return sanitizeAiEvent(parsed, eventType);
}

function extractJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) return text.slice(first, last + 1);
  return text;
}

export function sanitizeAiEvent(input: Partial<AiPetEvent>, eventType: AiEventType): AiPetEvent {
  const limit = ranges[eventType];
  const bound = (key: keyof typeof limit, fallback: number) => {
    const [min, max] = limit[key];
    const raw = Number(input[key] ?? fallback);
    return Math.max(min, Math.min(max, Math.round(Number.isFinite(raw) ? raw : fallback)));
  };
  const allowedStatus = ["normal", "happy", "hungry", "tired", "dirty", "sick"];
  return {
    title: String(input.title || fallbackEvent(eventType).title).slice(0, 40),
    story: String(input.story || fallbackEvent(eventType).story).slice(0, 120),
    moodDelta: bound("moodDelta", 5),
    energyDelta: bound("energyDelta", -10),
    hungerDelta: bound("hungerDelta", 5),
    cleanlinessDelta: bound("cleanlinessDelta", -3),
    expGain: bound("expGain", 10),
    coinsGain: bound("coinsGain", 3),
    statusHint: allowedStatus.includes(String(input.statusHint)) ? String(input.statusHint) : "normal"
  };
}

export function fallbackEvent(eventType: AiEventType): AiPetEvent {
  const events: Record<AiEventType, AiPetEvent> = {
    "ai-adventure": {
      title: "院子里的小冒险",
      story: "AI 暂时没有回应，宠物在院子里发现了一片闪闪发光的叶子，开心地把它带了回来。",
      moodDelta: 8,
      energyDelta: -10,
      hungerDelta: 5,
      cleanlinessDelta: -3,
      expGain: 15,
      coinsGain: 5,
      statusHint: "happy"
    },
    "ai-play": {
      title: "纸箱城堡",
      story: "宠物把纸箱当成城堡，钻进钻出玩得很开心，还在角落发现了一枚小硬币。",
      moodDelta: 14,
      energyDelta: -8,
      hungerDelta: 4,
      cleanlinessDelta: -2,
      expGain: 12,
      coinsGain: 2,
      statusHint: "happy"
    },
    "ai-work": {
      title: "点心店帮忙",
      story: "宠物去点心店帮忙递菜单，虽然弄脏了一点，但认真工作换来了满满奖励。",
      moodDelta: 2,
      energyDelta: -18,
      hungerDelta: 10,
      cleanlinessDelta: -8,
      expGain: 18,
      coinsGain: 25,
      statusHint: "normal"
    },
    "ai-random-event": {
      title: "窗边的小惊喜",
      story: "一阵风吹来彩色便签，宠物追着它转了一圈，今天的心情也变亮了一点。",
      moodDelta: 8,
      energyDelta: -4,
      hungerDelta: 2,
      cleanlinessDelta: 0,
      expGain: 8,
      coinsGain: 1,
      statusHint: "happy"
    }
  };
  return events[eventType];
}

export function applyAiEventToPet(pet: Pet, event: AiPetEvent) {
  const decayed = calculateDecay(pet);
  const progressed = normalizeProgress(decayed.level, decayed.exp + event.expGain, 2);
  const next = {
    ...decayed,
    level: progressed.level,
    exp: progressed.exp,
    coins: Math.max(0, decayed.coins + event.coinsGain),
    hunger: clamp(decayed.hunger + event.hungerDelta),
    mood: clamp(decayed.mood + event.moodDelta),
    energy: clamp(decayed.energy + event.energyDelta),
    cleanliness: clamp(decayed.cleanliness + event.cleanlinessDelta)
  };
  return {
    pet: { ...next, status: determineStatus(next) },
    result: { ...event, levelUps: progressed.levelUps }
  };
}
