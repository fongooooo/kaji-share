import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { formatCompletedDate, getCurrentPeriodKey, getCurrentPeriodLabel, getMonthRange } from '@/lib/period';
import { subscribeTasks } from '@/lib/tasks';
import { useAuth } from '@/state/auth-context';
import type { Task } from '@/types/models';

export default function HistoryScreen() {
  const { user, profile, initializing } = useAuth();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

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

  function shiftMonth(delta: number) {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
    setExpandedTaskId(null);
  }

  function completedByLabel(uid: string) {
    return uid === user?.uid ? '自分' : 'パートナー';
  }

  const { start, end } = getMonthRange(monthDate);

  function weeklyCompletionsInMonth(task: Task) {
    return Object.values(task.completions)
      .filter((c) => c.completedAt >= start && c.completedAt < end)
      .sort((a, b) => a.completedAt - b.completedAt);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.monthNav}>
          <Pressable style={styles.monthNavButton} onPress={() => shiftMonth(-1)}>
            <ThemedText type="linkPrimary">＜</ThemedText>
          </Pressable>
          <ThemedText type="smallBold">{getCurrentPeriodLabel('monthly', monthDate)}</ThemedText>
          <Pressable style={styles.monthNavButton} onPress={() => shiftMonth(1)}>
            <ThemedText type="linkPrimary">＞</ThemedText>
          </Pressable>
        </ThemedView>

        <FlatList
          data={tasks}
          keyExtractor={(task) => task.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              履歴がありません
            </ThemedText>
          }
          renderItem={({ item: task }) => {
            if (task.frequency === 'monthly') {
              const completion = task.completions[getCurrentPeriodKey('monthly', monthDate)] ?? null;
              return (
                <ThemedView type="backgroundElement" style={styles.taskRow}>
                  <ThemedText>{completion ? '✅' : '⬜️'}</ThemedText>
                  <ThemedView style={styles.taskInfo}>
                    <ThemedText type="default">{task.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {completion ? `${formatCompletedDate(completion.completedAt)}に完了` : '未実施'}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              );
            }

            const completions = weeklyCompletionsInMonth(task);
            const count = completions.length;
            const expanded = expandedTaskId === task.id;
            return (
              <Pressable
                style={styles.taskRowColumn}
                onPress={() => count > 0 && setExpandedTaskId(expanded ? null : task.id)}>
                <ThemedView type="backgroundElement" style={styles.weeklyHeaderRow}>
                  <ThemedText type="default">{task.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {count > 0 ? `${count}回実施 ${expanded ? '▾' : '▸'}` : '未実施'}
                  </ThemedText>
                </ThemedView>
                {expanded && (
                  <ThemedView style={styles.expandedList}>
                    {completions.map((c, i) => (
                      <ThemedText key={i} type="small" themeColor="textSecondary">
                        ・{formatCompletedDate(c.completedAt)}（{completedByLabel(c.completedBy)}）
                      </ThemedText>
                    ))}
                  </ThemedView>
                )}
              </Pressable>
            );
          }}
        />
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    marginBottom: Spacing.three,
  },
  monthNavButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
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
  taskInfo: {
    flex: 1,
    gap: 2,
  },
  taskRowColumn: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  weeklyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
  },
  expandedList: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: 4,
  },
});
