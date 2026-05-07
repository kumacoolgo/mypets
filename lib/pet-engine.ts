import type { Pet } from "@prisma/client";

export type PetAction = "feed" | "play" | "sleep" | "bath" | "work";
export type PetStats = Pick<Pet, "level" | "exp" | "coins" | "hunger" | "mood" | "energy" | "cleanliness" | "status" | "lastStateUpdateAt">;

export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function expRequired(level: number) {
  return 80 + level * 40;
}

export function determineStatus(pet: Pick<PetStats, "hunger" | "mood" | "energy" | "cleanliness">) {
  if (pet.mood <= 20 && pet.hunger <= 30) return "sick";
  if (pet.hunger <= 20) return "hungry";
  if (pet.energy <= 20) return "tired";
  if (pet.cleanliness <= 20) return "dirty";
  if (pet.mood >= 80 && pet.hunger >= 60) return "happy";
  return "normal";
}

export function normalizeProgress(level: number, exp: number, maxLevelUps = 2) {
  let nextLevel = level;
  let nextExp = Math.max(0, exp);
  let levelUps = 0;
  while (nextExp >= expRequired(nextLevel) && levelUps < maxLevelUps) {
    nextExp -= expRequired(nextLevel);
    nextLevel += 1;
    levelUps += 1;
  }
  return { level: nextLevel, exp: nextExp, levelUps };
}

export function calculateDecay<T extends PetStats>(pet: T, now = new Date()) {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(pet.lastStateUpdateAt).getTime()) / 60000));
  if (minutes <= 0) {
    return { ...pet, status: determineStatus(pet), lastStateUpdateAt: now, decay: { minutes } };
  }

  const next = {
    ...pet,
    hunger: clamp(pet.hunger - Math.floor(minutes / 10)),
    mood: clamp(pet.mood - Math.floor(minutes / 15)),
    energy: clamp(pet.energy - Math.floor(minutes / 20)),
    cleanliness: clamp(pet.cleanliness - Math.floor(minutes / 30)),
    lastStateUpdateAt: now
  };
  return {
    ...next,
    status: determineStatus(next),
    decay: { minutes }
  };
}

export function applyPetAction<T extends PetStats>(pet: T, action: PetAction) {
  const decayed = calculateDecay(pet);
  const deltas = {
    feed: { hunger: 25, mood: 5, energy: 0, cleanliness: 0, exp: 8, coins: 0 },
    play: { hunger: -8, mood: 18, energy: -15, cleanliness: -4, exp: 14, coins: 0 },
    sleep: { hunger: -10, mood: 4, energy: 28, cleanliness: 0, exp: 2, coins: 0 },
    bath: { hunger: 0, mood: 2, energy: -3, cleanliness: 30, exp: 8, coins: 0 },
    work: { hunger: -16, mood: -4, energy: -24, cleanliness: -16, exp: 20, coins: 18 }
  } satisfies Record<PetAction, { hunger: number; mood: number; energy: number; cleanliness: number; exp: number; coins: number }>;

  const delta = deltas[action];
  const progressed = normalizeProgress(decayed.level, decayed.exp + delta.exp);
  const next = {
    ...decayed,
    level: progressed.level,
    exp: progressed.exp,
    coins: Math.max(0, decayed.coins + delta.coins),
    hunger: clamp(decayed.hunger + delta.hunger),
    mood: clamp(decayed.mood + delta.mood),
    energy: clamp(decayed.energy + delta.energy),
    cleanliness: clamp(decayed.cleanliness + delta.cleanliness)
  };

  return {
    pet: { ...next, status: determineStatus(next) },
    result: {
      action,
      expGain: delta.exp,
      coinsGain: delta.coins,
      levelUps: progressed.levelUps,
      deltas: delta
    }
  };
}
