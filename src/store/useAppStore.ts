import { create } from 'zustand';
import type { NightShiftStage } from '@/types';

interface AppState {
  currentStage: NightShiftStage;
  stageLabels: Record<NightShiftStage, string>;
  workStartTime: string;
  workEndTime: string;
  setCurrentStage: (stage: NightShiftStage) => void;
  setWorkTime: (start: string, end: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentStage: 'mid',
  stageLabels: {
    early: '夜班初期',
    mid: '夜班中期',
    late: '夜班后期',
    pre_sleep: '睡前',
  },
  workStartTime: '22:00',
  workEndTime: '08:00',
  setCurrentStage: (stage) => set({ currentStage: stage }),
  setWorkTime: (start, end) => set({ workStartTime: start, workEndTime: end }),
}));
