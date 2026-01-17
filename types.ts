
export interface SportCategory {
  id: string;
  name: string;
  emoji: string;
  isCustom: boolean;
}

export interface ActivityRecord {
  id: string;
  date: string; // YYYY-MM-DD
  type: string; // 引用 SportCategory 的 name
  duration: number; // minutes
  recordedAt: string; // ISO string
  remarks?: string;
}

export interface UserGoals {
  annualDays: number;
  monthlyDays: number;
  dailyMinutes: number;
}

export interface AppState {
  activities: ActivityRecord[];
  goals: UserGoals;
  categories: SportCategory[];
}
