import { Redirect } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  formatCompletedDate,
  formatMonthColumnLabel,
  getCurrentPeriodKey,
  getMonthRange,
  getRecentMonths,
} from '@/lib/period';
import { subscribeTasks } from '@/lib/tasks';
import { useAuth } from '@/state/auth-context';
import type { Task, TaskCompletion } from '@/types/models';

type HistoryTab = 'status' | 'monthly';

// マトリクス表示の対象月数(直近1年分)
const MONTH_RANGE = 12;
// スマホ幅(375px前後)でもスクロールなしで6ヶ月分＋タスク名列が収まる幅にする
const NAME_COLUMN_WIDTH = 84;
const CELL_WIDTH = 38;
const ROW_HEIGHT = 40;

export default function HistoryScreen() {
  const { user, profile, initializing } = useAuth();
  const [historyTab, setHistoryTab] = useState<HistoryTab>('status');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ task: Task; month: Date } | null>(null);
  const monthScrollRef = useRef<ScrollView>(null);

  const coupleId = profile?.coupleId ?? null;
  const months = useMemo(() => getRecentMonths(MONTH_RANGE), []);

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

  function completedByLabel(uid: string) {
    return uid === user?.uid ? '自分' : 'パートナー';
  }

  function lastCompletedAt(task: Task): number | null {
    const timestamps = Object.values(task.completions).map((c) => c.completedAt);
    return timestamps.length > 0 ? Math.max(...timestamps) : null;
  }

  // 指定した月の範囲(start〜end)に完了した実施記録を、日付の昇順で返す
  function completionsInRange(task: Task, start: number, end: number): TaskCompletion[] {
    return Object.values(task.completions)
      .filter((c) => c.completedAt >= start && c.completedAt < end)
      .sort((a, b) => a.completedAt - b.completedAt);
  }

  // タスクがその月にまだ登録されていなかった場合はセルを空欄にする(createdAtが無い旧データは常に登録済み扱い)
  function existedInMonth(task: Task, monthEnd: number): boolean {
    return task.createdAt === 0 || task.createdAt < monthEnd;
  }

  const statusRows = [...tasks].sort((a, b) => {
    const lastA = lastCompletedAt(a);
    const lastB = lastCompletedAt(b);
    if (lastA === null && lastB === null) return 0;
    if (lastA === null) return -1;
    if (lastB === null) return 1;
    return lastB - lastA;
  });

  const matrixRows = [...tasks].sort((a, b) => (a.isPaused === b.isPaused ? 0 : a.isPaused ? 1 : -1));

  const selectedCompletions = selectedCell
    ? (() => {
        const { start, end } = getMonthRange(selectedCell.month);
        return completionsInRange(selectedCell.task, start, end);
      })()
    : [];

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
        ) : matrixRows.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={styles.emptyText}>
            履歴がありません
          </ThemedText>
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={styles.matrixScrollContent}>
            <ThemedView style={styles.matrixContainer}>
              <ThemedView style={styles.nameColumn}>
                <ThemedView style={styles.headerSpacer} />
                {matrixRows.map((task) => (
                  <ThemedView
                    key={task.id}
                    type="backgroundElement"
                    style={[styles.nameCell, task.isPaused && styles.taskRowPaused]}>
                    <ThemedText type="small" numberOfLines={1}>
                      {task.title}
                      {task.isPaused ? '（保留中）' : ''}
                    </ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>

              <ScrollView
                ref={monthScrollRef}
                horizontal
                showsHorizontalScrollIndicator
                onContentSizeChange={() => monthScrollRef.current?.scrollToEnd({ animated: false })}>
                <ThemedView>
                  <ThemedView style={styles.monthHeaderRow}>
                    {months.map((month) => (
                      <ThemedView key={month.getTime()} style={styles.monthHeaderCell}>
                        <ThemedText themeColor="textSecondary" style={styles.monthHeaderText}>
                          {formatMonthColumnLabel(month)}
                        </ThemedText>
                      </ThemedView>
                    ))}
                  </ThemedView>

                  {matrixRows.map((task) => (
                    <ThemedView key={task.id} style={styles.monthRow}>
                      {months.map((month) => {
                        const { start, end } = getMonthRange(month);
                        if (!existedInMonth(task, end)) {
                          return (
                            <ThemedView key={month.getTime()} style={styles.monthCell}>
                              <ThemedText themeColor="textSecondary">−</ThemedText>
                            </ThemedView>
                          );
                        }
                        const done =
                          task.frequency === 'monthly'
                            ? task.completions[getCurrentPeriodKey('monthly', month)] !== undefined
                            : completionsInRange(task, start, end).length > 0;
                        return (
                          <Pressable
                            key={month.getTime()}
                            style={styles.monthCell}
                            disabled={!done}
                            onPress={() => setSelectedCell({ task, month })}>
                            <ThemedText>{done ? '✅' : '⬜️'}</ThemedText>
                          </Pressable>
                        );
                      })}
                    </ThemedView>
                  ))}
                </ThemedView>
              </ScrollView>
            </ThemedView>
          </ScrollView>
        )}
      </SafeAreaView>

      <Modal visible={selectedCell !== null} transparent animationType="slide" onRequestClose={() => setSelectedCell(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedCell(null)}>
          <Pressable onPress={() => {}}>
            <ThemedView style={styles.modalCard}>
              {selectedCell && (
                <>
                  <ThemedText type="smallBold">
                    {selectedCell.task.title}（{formatMonthColumnLabel(selectedCell.month)}）
                  </ThemedText>
                  <ThemedView style={styles.modalList}>
                    {selectedCompletions.map((c, i) => (
                      <ThemedText key={i} type="small" themeColor="textSecondary">
                        ・{formatCompletedDate(c.completedAt)}（{completedByLabel(c.completedBy)}）
                      </ThemedText>
                    ))}
                  </ThemedView>
                  <Pressable style={styles.modalCloseButton} onPress={() => setSelectedCell(null)}>
                    <ThemedText type="linkPrimary">閉じる</ThemedText>
                  </Pressable>
                </>
              )}
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
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
  matrixScrollContent: {
    paddingBottom: Spacing.four,
  },
  matrixContainer: {
    flexDirection: 'row',
  },
  nameColumn: {
    width: NAME_COLUMN_WIDTH,
  },
  headerSpacer: {
    height: ROW_HEIGHT,
  },
  nameCell: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8884',
  },
  monthHeaderRow: {
    flexDirection: 'row',
  },
  monthHeaderCell: {
    width: CELL_WIDTH,
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthHeaderText: {
    fontSize: 11,
    lineHeight: 14,
  },
  monthRow: {
    flexDirection: 'row',
  },
  monthCell: {
    width: CELL_WIDTH,
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8884',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#0006',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  modalList: {
    gap: 4,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.two,
  },
});
