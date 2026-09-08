import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { Task, TaskCompletion, TaskFrequency } from '@/types/models';

function tasksCollection(coupleId: string) {
  return collection(db, 'couples', coupleId, 'tasks');
}

function toTask(id: string, data: Record<string, unknown>): Task {
  const rawCompletions = (data.completions as Record<string, { completedBy: string; completedAt: Timestamp }>) ?? {};
  const completions: Record<string, TaskCompletion> = {};
  for (const [period, completion] of Object.entries(rawCompletions)) {
    completions[period] = {
      completedBy: completion.completedBy,
      completedAt: completion.completedAt?.toMillis() ?? 0,
    };
  }
  return {
    id,
    title: data.title as string,
    assigneeUid: (data.assigneeUid as string | null) ?? null,
    frequency: data.frequency as TaskFrequency,
    completions,
    updatedAt: (data.updatedAt as Timestamp | undefined)?.toMillis() ?? 0,
  };
}

export function subscribeTasks(coupleId: string, onChange: (tasks: Task[]) => void) {
  const q = query(tasksCollection(coupleId), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((docSnapshot) => toTask(docSnapshot.id, docSnapshot.data())));
  });
}

export async function getTask(coupleId: string, taskId: string): Promise<Task | null> {
  const snapshot = await getDoc(doc(db, 'couples', coupleId, 'tasks', taskId));
  if (!snapshot.exists()) return null;
  return toTask(snapshot.id, snapshot.data());
}

export async function createTask(
  coupleId: string,
  input: { title: string; assigneeUid: string | null; frequency: TaskFrequency },
) {
  await addDoc(tasksCollection(coupleId), {
    title: input.title,
    assigneeUid: input.assigneeUid,
    frequency: input.frequency,
    completions: {},
    updatedAt: serverTimestamp(),
  });
}

export async function updateTask(
  coupleId: string,
  taskId: string,
  input: { title: string; assigneeUid: string | null; frequency: TaskFrequency },
) {
  await updateDoc(doc(db, 'couples', coupleId, 'tasks', taskId), {
    title: input.title,
    assigneeUid: input.assigneeUid,
    frequency: input.frequency,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(coupleId: string, taskId: string) {
  await deleteDoc(doc(db, 'couples', coupleId, 'tasks', taskId));
}

export async function setTaskPeriodCompletion(
  coupleId: string,
  taskId: string,
  periodKey: string,
  uid: string,
  done: boolean,
) {
  await updateDoc(doc(db, 'couples', coupleId, 'tasks', taskId), {
    [`completions.${periodKey}`]: done ? { completedBy: uid, completedAt: serverTimestamp() } : deleteField(),
    updatedAt: serverTimestamp(),
  });
}
