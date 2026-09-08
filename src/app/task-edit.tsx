import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { subscribeCoupleMemberUids } from '@/lib/couples';
import { createTask, getTask, updateTask } from '@/lib/tasks';
import { useAuth } from '@/state/auth-context';
import type { TaskFrequency } from '@/types/models';

type AssigneeChoice = 'me' | 'partner' | 'either';

export default function TaskEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState<AssigneeChoice>('either');
  const [frequency, setFrequency] = useState<TaskFrequency>('weekly');
  const [partnerUid, setPartnerUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const coupleId = profile?.coupleId ?? null;

  useEffect(() => {
    if (!coupleId || !user) return;
    return subscribeCoupleMemberUids(coupleId, (memberUids) => {
      setPartnerUid(memberUids.find((uid) => uid !== user.uid) ?? null);
    });
  }, [coupleId, user]);

  useEffect(() => {
    if (!id || !coupleId || !user) return;
    getTask(coupleId, id).then((task) => {
      if (!task) return;
      setTitle(task.title);
      setFrequency(task.frequency);
      if (task.assigneeUid === null) setAssignee('either');
      else setAssignee(task.assigneeUid === user.uid ? 'me' : 'partner');
      setLoading(false);
    });
  }, [id, coupleId, user]);

  async function handleSubmit() {
    if (!coupleId || !user) return;
    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const assigneeUid = assignee === 'me' ? user.uid : assignee === 'partner' ? partnerUid : null;
      if (id) {
        await updateTask(coupleId, id, { title: title.trim(), assigneeUid, frequency });
      } else {
        await createTask(coupleId, { title: title.trim(), assigneeUid, frequency });
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText themeColor="textSecondary">読み込み中...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="small" themeColor="textSecondary">
          家事の名前
        </ThemedText>
        <TextInput
          placeholder="例: 換気扇フィルター掃除"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />

        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          頻度
        </ThemedText>
        <ThemedView style={styles.choiceRow}>
          {(
            [
              ['weekly', '毎週'],
              ['monthly', '毎月'],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setFrequency(value)}
              style={[styles.choice, frequency === value && styles.choiceActive]}>
              <ThemedText type="smallBold">{label}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
          担当
        </ThemedText>
        <ThemedView style={styles.choiceRow}>
          {(
            [
              ['me', '自分'],
              ['partner', 'パートナー'],
              ['either', 'どちらでも'],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setAssignee(value)}
              style={[styles.choice, assignee === value && styles.choiceActive]}>
              <ThemedText type="smallBold">{label}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>

        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
          <ThemedText type="smallBold" themeColor="background">
            {submitting ? '保存中...' : '保存する'}
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
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderColor: '#8888',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    marginBottom: Spacing.two,
  },
  sectionLabel: {
    marginTop: Spacing.two,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  choice: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    backgroundColor: '#8882',
  },
  choiceActive: {
    backgroundColor: '#3c87f7',
  },
  error: {
    color: '#d33',
    marginTop: Spacing.two,
  },
  submitButton: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
});
