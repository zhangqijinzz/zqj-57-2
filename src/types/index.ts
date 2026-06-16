export type IndustryType = 'factory' | 'convenience' | 'security';

export type NightShiftStage = 'early' | 'mid' | 'late' | 'pre_sleep';

export interface Worker {
  id: string;
  name: string;
  avatar: string;
  industry: IndustryType;
  industryLabel: string;
  shiftTime: string;
  shiftStart: string;
  shiftEnd: string;
  workplace: string;
  status: 'on_shift' | 'rest' | 'offline';
  statusLabel: string;
  voiceMessage?: string;
  voiceDuration?: number;
  lastActive: string;
  tags: string[];
}

export interface VoiceMessage {
  id: string;
  workerId: string;
  workerName: string;
  workerAvatar: string;
  content: string;
  duration: number;
  timestamp: string;
  isRead: boolean;
  replies?: VoiceMessage[];
}

export interface Game {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  playCount: number;
  highScore: number;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  category: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  category: 'refresh' | 'sleep' | 'energy';
  categoryLabel: string;
  suitableStage: NightShiftStage[];
  suitableStageLabels: string[];
  ingredients: string[];
  steps: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
  };
  author?: {
    name: string;
    avatar: string;
    workplace: string;
  };
  likes: number;
  isShared: boolean;
  isNew?: boolean;
}

export interface CountdownItem {
  id: string;
  type: 'off_work' | 'sunrise' | 'family_wake';
  label: string;
  targetTime: string;
  icon: string;
  color: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedDate?: string;
  progress: number;
  target: number;
  category: 'checkin' | 'social' | 'game' | 'health';
}

export interface IndustryTag {
  type: IndustryType;
  label: string;
  count: number;
}
