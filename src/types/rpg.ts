/**
 * Frontend TypeScript contracts for XPerience (Life RPG)
 * Decoupled from backend implementation for clean UI development
 */

export type QuestDifficulty = "trivial" | "easy" | "medium" | "hard" | "legendary";

export type RarityTier = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

export type CharacterAttributeType = "strength" | "intellect" | "vitality" | "agility" | "focus";

export interface Quest {
  id: string;
  title: string;
  description?: string;
  difficulty: QuestDifficulty;
  attributeTarget: CharacterAttributeType;
  xpReward: number;
  goldReward: number;
  isCompleted: boolean;
  completedAt?: string;
  dueDate?: string;
  createdAt: string;
}

export interface CharacterAttributes {
  strength: number;
  intellect: number;
  vitality: number;
  agility: number;
  focus: number;
}

export interface Hero {
  id: string;
  name: string;
  title: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  gold: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  streakDays: number;
  avatarUrl?: string;
  attributes: CharacterAttributes;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  rarity: RarityTier;
  cost: number;
  iconName: string;
  category: "equipment" | "potion" | "relic" | "cosmetic";
  isEquipped?: boolean;
  bonusEffect?: string;
}
