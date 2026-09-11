export type TaskFrequency = 'weekly' | 'monthly';

export type TaskCompletion = {
  completedBy: string;
  completedAt: number;
};

export type Task = {
  id: string;
  title: string;
  assigneeUid: string | null;
  frequency: TaskFrequency;
  // キー: 週次なら"2026-W37"、月次なら"2026-09"のような期間キー
  completions: Record<string, TaskCompletion>;
  isPaused: boolean;
  updatedAt: number;
};

export type UserProfile = {
  uid: string;
  name: string;
  coupleId: string | null;
  pushToken?: string | null;
};
