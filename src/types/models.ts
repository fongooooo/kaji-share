export type TaskFrequency = 'weekly' | 'monthly';
export type TaskStatus = 'pending' | 'done';

export type Task = {
  id: string;
  title: string;
  assigneeUid: string | null;
  frequency: TaskFrequency;
  status: TaskStatus;
  completedBy: string | null;
  completedAt: number | null;
  updatedAt: number;
};

export type UserProfile = {
  uid: string;
  name: string;
  coupleId: string | null;
  pushToken?: string | null;
};
