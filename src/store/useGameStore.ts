import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { LeaderboardEntry, PendingScore, SavedGameState } from '@/types';

const STORAGE_KEY_LEADERBOARD = 'game_leaderboard';
const STORAGE_KEY_MY_BEST = 'game_my_best';
const STORAGE_KEY_PENDING = 'game_pending_scores';
const STORAGE_KEY_GAME_STATE = 'game_saved_state';
const CURRENT_USER_NAME = '我';

const FAKE_PLAYERS = [
  { name: '老王', avatar: '👨‍🏭' },
  { name: '小李', avatar: '👨‍🔧' },
  { name: '张姐', avatar: '👩‍💼' },
  { name: '赵哥', avatar: '👨‍💻' },
  { name: '陈姐', avatar: '👩‍🔬' },
  { name: '刘叔', avatar: '👴' },
  { name: '小周', avatar: '🧑‍🚀' },
  { name: '大马', avatar: '🧔' },
];

const INITIAL_SCORES: Record<string, number[]> = {
  '1': [2580, 2340, 2100, 1890, 1650],
  '2': [1860, 1720, 1580, 1340, 1200],
  '3': [3200, 2950, 2680, 2410, 2150],
  '4': [4100, 3780, 3450, 3100, 2850],
  '5': [2880, 2620, 2350, 2100, 1880],
  '6': [1560, 1380, 1200, 1050, 880],
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = Taro.getStorageSync(key);
    if (raw) return JSON.parse(raw) as T;
  } catch (_e) {
    // ignore
  }
  return fallback;
}

function saveToStorage(key: string, data: unknown): boolean {
  try {
    Taro.setStorageSync(key, JSON.stringify(data));
    return true;
  } catch (_e) {
    return false;
  }
}

function buildLeaderboard(gameId: string, scores: number[], myBest: number): LeaderboardEntry[] {
  const allScores: { name: string; avatar: string; score: number; isCurrentUser: boolean }[] = [];

  const initial = INITIAL_SCORES[gameId] || [];
  scores.forEach((s, i) => {
    allScores.push({
      name: FAKE_PLAYERS[i % FAKE_PLAYERS.length].name,
      avatar: FAKE_PLAYERS[i % FAKE_PLAYERS.length].avatar,
      score: s,
      isCurrentUser: false,
    });
  });

  if (initial.length > scores.length) {
    for (let i = scores.length; i < initial.length; i++) {
      const playerIdx = i % FAKE_PLAYERS.length;
      allScores.push({
        name: FAKE_PLAYERS[playerIdx].name,
        avatar: FAKE_PLAYERS[playerIdx].avatar,
        score: initial[i],
        isCurrentUser: false,
      });
    }
  }

  if (myBest > 0) {
    allScores.push({
      name: CURRENT_USER_NAME,
      avatar: '😎',
      score: myBest,
      isCurrentUser: true,
    });
  }

  allScores.sort((a, b) => b.score - a.score);

  return allScores.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}

interface GameState {
  leaderboards: Record<string, number[]>;
  myBestScores: Record<string, number>;
  pendingScores: PendingScore[];
  previousRank: Record<string, number>;

  getLeaderboard: (gameId: string) => LeaderboardEntry[];
  getMyBest: (gameId: string) => number;
  getMyRank: (gameId: string) => number;
  submitScore: (gameId: string, score: number) => boolean;
  retryPendingScores: (gameId: string) => void;
  refreshLeaderboard: (gameId: string) => { oldRank: number; newRank: number };
  saveGameState: (state: SavedGameState) => void;
  loadGameState: (gameId: string) => SavedGameState | null;
  clearGameState: (gameId: string) => void;
  getPendingCount: (gameId: string) => number;
  _persist: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  leaderboards: loadFromStorage<Record<string, number[]>>(STORAGE_KEY_LEADERBOARD, {}),
  myBestScores: loadFromStorage<Record<string, number>>(STORAGE_KEY_MY_BEST, {}),
  pendingScores: loadFromStorage<PendingScore[]>(STORAGE_KEY_PENDING, []),
  previousRank: {},

  getLeaderboard: (gameId: string) => {
    const { leaderboards, myBestScores } = get();
    const scores = leaderboards[gameId] || INITIAL_SCORES[gameId] || [];
    const myBest = myBestScores[gameId] || 0;
    return buildLeaderboard(gameId, scores, myBest);
  },

  getMyBest: (gameId: string) => {
    return get().myBestScores[gameId] || 0;
  },

  getMyRank: (gameId: string) => {
    const lb = get().getLeaderboard(gameId);
    const me = lb.find((e) => e.isCurrentUser);
    return me ? me.rank : lb.length + 1;
  },

  submitScore: (gameId: string, score: number) => {
    const state = get();
    const currentBest = state.myBestScores[gameId] || 0;

    if (score > currentBest) {
      const newMyBest = { ...state.myBestScores, [gameId]: score };
      const success = saveToStorage(STORAGE_KEY_MY_BEST, newMyBest);

      if (!success) {
        const pending: PendingScore = {
          gameId,
          score,
          timestamp: Date.now(),
          retries: 0,
        };
        const newPending = [...state.pendingScores, pending];
        saveToStorage(STORAGE_KEY_PENDING, newPending);
        set({ pendingScores: newPending });
        return false;
      }

      set({ myBestScores: newMyBest });
      state._persist();
      return true;
    }

    return true;
  },

  retryPendingScores: (gameId: string) => {
    const state = get();
    const pending = state.pendingScores.filter((p) => p.gameId === gameId);
    const remaining: PendingScore[] = [];

    for (const p of pending) {
      const currentBest = get().myBestScores[gameId] || 0;
      if (p.score > currentBest) {
        const newMyBest = { ...get().myBestScores, [gameId]: p.score };
        const success = saveToStorage(STORAGE_KEY_MY_BEST, newMyBest);
        if (success) {
          set({ myBestScores: newMyBest });
          Taro.showToast({ title: '分数提交成功！', icon: 'success' });
        } else {
          p.retries += 1;
          if (p.retries < 5) {
            remaining.push(p);
          }
        }
      }
    }

    const allRemaining = [
      ...state.pendingScores.filter((p) => p.gameId !== gameId),
      ...remaining,
    ];
    saveToStorage(STORAGE_KEY_PENDING, allRemaining);
    set({ pendingScores: allRemaining });
  },

  refreshLeaderboard: (gameId: string) => {
    const state = get();
    const oldRank = state.getMyRank(gameId);

    state.previousRank = { ...state.previousRank, [gameId]: oldRank };

    const currentScores = state.leaderboards[gameId] || [...(INITIAL_SCORES[gameId] || [])];

    const mutationCount = Math.floor(Math.random() * 3);
    const newScores = [...currentScores];
    for (let i = 0; i < mutationCount; i++) {
      const idx = Math.floor(Math.random() * newScores.length);
      const delta = Math.floor(Math.random() * 200) - 50;
      newScores[idx] = Math.max(0, newScores[idx] + delta);
    }

    if (Math.random() > 0.6 && newScores.length < 8) {
      const newPlayerScore = Math.floor(Math.random() * 3000) + 500;
      newScores.push(newPlayerScore);
    }

    newScores.sort((a, b) => b - a);

    const newLeaderboards = { ...state.leaderboards, [gameId]: newScores };
    saveToStorage(STORAGE_KEY_LEADERBOARD, newLeaderboards);
    set({ leaderboards: newLeaderboards });

    const newRank = get().getMyRank(gameId);

    return { oldRank, newRank };
  },

  saveGameState: (gameState: SavedGameState) => {
    const key = `${STORAGE_KEY_GAME_STATE}_${gameState.gameId}`;
    saveToStorage(key, gameState);
  },

  loadGameState: (gameId: string) => {
    const key = `${STORAGE_KEY_GAME_STATE}_${gameId}`;
    return loadFromStorage<SavedGameState | null>(key, null);
  },

  clearGameState: (gameId: string) => {
    const key = `${STORAGE_KEY_GAME_STATE}_${gameId}`;
    try {
      Taro.removeStorageSync(key);
    } catch (_e) {
      // ignore
    }
  },

  getPendingCount: (gameId: string) => {
    return get().pendingScores.filter((p) => p.gameId === gameId).length;
  },

  _persist: () => {
    const state = get();
    saveToStorage(STORAGE_KEY_LEADERBOARD, state.leaderboards);
    saveToStorage(STORAGE_KEY_MY_BEST, state.myBestScores);
  },
}));
