import {
  addDoc,
  collection,
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
import type { Task, TaskFrequency } from '@/types/models';

function tasksCollection(coupleId: string) {
  return collection(db, 'couples', coupleId, 'tasks');
}

export function subscribeTasks(coupleId: string, onChange: (tasks: Task[]) => void) {
  const q = query(tasksCollection(coupleId), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        title: data.title,
        assigneeUid: data.assigneeUid ?? null,
        frequency: data.frequency,
        status: data.status,
        completedBy: data.completedBy ?? null,
        completedAt: (data.completedAt as Timestamp | null)?.toMillis() ?? null,
        updatedAt: (data.updatedAt as Timestamp | undefined)?.toMillis() ?? 0,
      } satisfies Task;
    });
    onChange(tasks);
  });
}

export async function getTask(coupleId: string, taskId: string): Promise<Task | null> {
  const snapshot = await getDoc(doc(db, 'couples', coupleId, 'tasks', taskId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: data.title,
    assigneeUid: data.assigneeUid ?? null,
    frequency: data.frequency,
    status: data.status,
    completedBy: data.completedBy ?? null,
    completedAt: (data.completedAt as Timestamp | null)?.toMillis() ?? null,
    updatedAt: (data.updatedAt as Timestamp | undefined)?.toMillis() ?? 0,
  };
}

export async function createTask(
  coupleId: string,
  input: { title: string; assigneeUid: string | null; frequency: TaskFrequency },
) {
  await addDoc(tasksCollection(coupleId), {
    title: input.title,
    assigneeUid: input.assigneeUid,
    frequency: input.frequency,
    status: 'pending',
    completedBy: null,
    completedAt: null,
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

export async function setTaskStatus(coupleId: string, taskId: string, uid: string, done: boolean) {
  await updateDoc(doc(db, 'couples', coupleId, 'tasks', taskId), {
    status: done ? 'done' : 'pending',
    completedBy: done ? uid : null,
    completedAt: done ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}
