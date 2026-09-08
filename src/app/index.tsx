import { Link, Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getCurrentPeriodKey, getCurrentPeriodLabel } from '@/lib/period';
import { setTaskPeriodCompletion, subscribeTasks } from '@/lib/tasks';
import { useAuth } from '@/state/auth-context';
import type { Task, TaskFrequency } from '@/types/models';

type FrequencyTab = TaskFrequency | 'all';

export default function TaskListScreen() {
  const { user, profile, initializing, signOut } = useAuth();
  const router = useRouter();
  const [frequencyTab, setFrequencyTab] = useState<FrequencyTab>('all');
  const [onlyMine, setOnlyMine] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  const coupleId = profile?.coupleId ?? null;

  useEffect(() => {
    if (!coupleId) return;
    return subscribeTasks(coupleId, setTasks);
  }, [coupleId]);

  if (!initializing && !user) {
    return <Redirect href="/login" />;
  }
  if (user && profile && !profile.coupleId) {
    return <Redirect href="/pair" />;
  }
  if (initializing || !profile) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText themeColor="textSecondary">読み込み中...</ThemedText>
      </ThemedView>
    );
  }

  const isDone = (task: Task) => getCurrentPeriodKey(task.frequency) in task.completions;

  const visibleTasks = tasks
    .filter((task) => frequencyTab === 'all' || task.frequency === frequencyTab)
    .filter((task) => !onlyMine || task.assigneeUid === user?.uid)
    .sort((a, b) => (isDone(a) === isDone(b) ? 0 : isDone(a) ? 1 : -1));

  function assigneeLabel(task: Task) {
    if (task.assigneeUid === null) return 'どちらでも';
    return task.assigneeUid === user?.uid ? '自分' : 'パートナー';
  }

  function frequencyLabel(task: Task) {
    return task.frequency === 'weekly' ? '毎週' : '毎月';
  }

  async function handleToggle(task: Task) {
    if (!coupleId || !user) return;
    await setTaskPeriodCompletion(coupleId, task.id, getCurrentPeriodKey(task.frequency), user.uid, !isDone(task));
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            家事タスク
          </ThemedText>
          <Pressable onPress={() => router.push('/task-edit')}>
            <ThemedText type="linkPrimary">＋ 追加</ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.tabs}>
          {(['weekly', 'monthly', 'all'] as const).map((value) => (
            <Pressable
              key={value}
              onPress={() => setFrequencyTab(value)}
              style={[styles.tab, frequencyTab === value && styles.tabActive]}>
              <ThemedText type="smallBold">
                {value === 'weekly' ? '今週' : value === 'monthly' ? '今月' : 'すべて'}
              </ThemedText>
            </Pressable>
          ))}
        </ThemedView>

        <ThemedView style={styles.subRow}>
          {frequencyTab !== 'all' && (
            <ThemedText type="small" themeColor="textSecondary">
              {getCurrentPeriodLabel(frequencyTab)}
            </ThemedText>
          )}
          <Pressable style={styles.onlyMineToggle} onPress={() => setOnlyMine((v) => !v)}>
            <ThemedText type="small" themeColor={onlyMine ? undefined : 'textSecondary'}>
              {onlyMine ? '☑' : '☐'} 自分のタスクのみ
            </ThemedText>
          </Pressable>
        </ThemedView>

        <FlatList
          data={visibleTasks}
          keyExtractor={(task) => task.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              まだタスクがありません。右上の「＋ 追加」から登録しましょう。
            </ThemedText>
          }
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.taskRow}>
              <Pressable style={styles.checkbox} onPress={() => handleToggle(item)}>
                <ThemedText>{isDone(item) ? '✅' : '⬜️'}</ThemedText>
              </Pressable>
              <Link href={{ pathname: '/task-edit', params: { id: item.id } }} asChild>
                <Pressable style={styles.taskInfo}>
                  <ThemedText type="default" style={isDone(item) ? styles.taskDone : undefined}>
                    {item.title}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    担当: {assigneeLabel(item)}
                    {frequencyTab === 'all' ? ` ・ ${frequencyLabel(item)}` : ''}
                  </ThemedText>
                </Pressable>
              </Link>
            </ThemedView>
          )}
        />

        <Pressable onPress={() => signOut()}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.signOut}>
            ログアウト
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 28,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  tab: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    backgroundColor: '#8882',
  },
  tabActive: {
    backgroundColor: '#3c87f7',
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  onlyMineToggle: {
    marginLeft: 'auto',
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  checkbox: {
    padding: Spacing.one,
  },
  taskInfo: {
    flex: 1,
    gap: 2,
  },
  taskDone: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  signOut: {
    textAlign: 'center',
    paddingVertical: Spacing.three,
  },
});
