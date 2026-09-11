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

type HistoryTab = 'status' | 'monthly';

export default function HistoryScreen() {
  const { user, profile, initializing } = useAuth();
  const [historyTab, setHistoryTab] = useState<HistoryTab>('status');
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

  function lastCompletedAt(task: Task): number | null {
    const timestamps = Object.values(task.completions).map((c) => c.completedAt);
    return timestamps.length > 0 ? Math.max(...timestamps) : null;
  }

  const { start, end } = getMonthRange(monthDate);

  function weeklyCompletionsInMonth(task: Task) {
    return Object.values(task.completions)
      .filter((c) => c.completedAt >= start && c.completedAt < end)
      .sort((a, b) => a.completedAt - b.completedAt);
  }

  const statusRows = [...tasks].sort((a, b) => {
    const lastA = lastCompletedAt(a);
    const lastB = lastCompletedAt(b);
    if (lastA === null && lastB === null) return 0;
    if (lastA === null) return -1;
    if (lastB === null) return 1;
    return lastB - lastA;
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.tabs}>
          {(['status', 'monthly'] as const).map((value) => (
            <Pressable
              key={value}
              onPress={() => setHistoryTab(value)}
              style={[styles.tab, historyTab === value && styles.tabActive]}>
              <ThemedText type="smallBold">{value === 'status' ? '実施状況' : '月別'}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>

        {historyTab === 'monthly' && (
          <ThemedView style={styles.monthNav}>
            <Pressable style={styles.monthNavButton} onPress={() => shiftMonth(-1)}>
              <ThemedText type="linkPrimary">＜</ThemedText>
            </Pressable>
            <ThemedText type="smallBold">{getCurrentPeriodLabel('monthly', monthDate)}</ThemedText>
            <Pressable style={styles.monthNavButton} onPress={() => shiftMonth(1)}>
              <ThemedText type="linkPrimary">＞</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {historyTab === 'status' ? (
          <FlatList
            data={statusRows}
            keyExtractor={(task) => task.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                履歴がありません
              </ThemedText>
            }
            renderItem={({ item: task }) => {
              const last = lastCompletedAt(task);
              return (
                <ThemedView
                  type="backgroundElement"
                  style={[styles.taskRow, task.isPaused && styles.taskRowPaused]}>
                  <ThemedView style={styles.taskInfo}>
                    <ThemedText type="default">
                      {task.title}
                      {task.isPaused ? '（保留中）' : ''}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {last !== null ? `最終実施日: ${formatCompletedDate(last)}` : '未実施'}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              );
            }}
          />
        ) : (
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
                  <ThemedView
                    type="backgroundElement"
                    style={[styles.taskRow, task.isPaused && styles.taskRowPaused]}>
                    <ThemedText>{completion ? '✅' : '⬜️'}</ThemedText>
                    <ThemedView style={styles.taskInfo}>
                      <ThemedText type="default">
                        {task.title}
                        {task.isPaused ? '（保留中）' : ''}
                      </ThemedText>
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
                  <ThemedView
                    type="backgroundElement"
                    style={[styles.weeklyHeaderRow, task.isPaused && styles.taskRowPaused]}>
                    <ThemedText type="default">
                      {task.title}
                      {task.isPaused ? '（保留中）' : ''}
                    </ThemedText>
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
        )}
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
  taskRowPaused: {
    opacity: 0.5,
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
