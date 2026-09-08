import { Redirect, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { createCouple, joinCoupleByInviteCode } from '@/lib/couples';
import { useAuth } from '@/state/auth-context';

export default function PairScreen() {
  const { user, initializing, profile } = useAuth();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // createCoupleのFirestore書き込み後、profile.coupleIdの購読更新がsetCreatedCodeより先に
  // 届くことがあるため、React stateではなくrefで同期的に「発行中/発行済み」を管理する
  const justPairedRef = useRef(false);

  if (!initializing && !user) {
    return <Redirect href="/login" />;
  }
  // 自分で招待コードを発行した直後はこの画面のまま表示を続けたいので、
  // 発行フロー中でない場合のみ自動でタスク一覧へ遷移する
  if (profile?.coupleId && !justPairedRef.current) {
    return <Redirect href="/" />;
  }

  async function handleCreate() {
    if (!user) return;
    justPairedRef.current = true;
    setError(null);
    setSubmitting(true);
    try {
      const { inviteCode: code } = await createCouple(user.uid);
      setCreatedCode(code);
    } catch (e) {
      justPairedRef.current = false;
      setError(e instanceof Error ? e.message : 'ペアの作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin() {
    if (!user) return;
    setError(null);
    setSubmitting(true);
    try {
      await joinCoupleByInviteCode(user.uid, inviteCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : '参加に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  if (createdCode) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="title" style={styles.title}>
            招待コードを発行しました
          </ThemedText>
          <ThemedText themeColor="textSecondary">このコードをパートナーに伝えてください</ThemedText>
          <ThemedView type="backgroundElement" style={styles.codeBox}>
            <ThemedText type="title" style={styles.codeText}>
              {createdCode}
            </ThemedText>
          </ThemedView>
          <Pressable style={styles.submitButton} onPress={() => router.replace('/')}>
            <ThemedText type="smallBold" themeColor="background">
              タスク一覧へ進む
            </ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          パートナーと繋げる
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          先に登録した方は招待コードを発行し、後から登録した方はそのコードを入力してください
        </ThemedText>

        <Pressable style={styles.submitButton} onPress={handleCreate} disabled={submitting}>
          <ThemedText type="smallBold" themeColor="background">
            招待コードを発行する
          </ThemedText>
        </Pressable>

        <ThemedText type="small" themeColor="textSecondary" style={styles.orText}>
          または
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.form}>
          <TextInput
            placeholder="招待コードを入力"
            value={inviteCode}
            onChangeText={setInviteCode}
            style={styles.input}
            autoCapitalize="characters"
          />
          <Pressable style={styles.submitButtonSecondary} onPress={handleJoin} disabled={submitting}>
            <ThemedText type="smallBold">コードで参加する</ThemedText>
          </Pressable>
        </ThemedView>

        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderColor: '#8888',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 2,
  },
  submitButton: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  submitButtonSecondary: {
    borderWidth: 1,
    borderColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  orText: {
    marginVertical: Spacing.one,
  },
  codeBox: {
    borderRadius: Spacing.four,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
  },
  codeText: {
    letterSpacing: 8,
  },
  error: {
    color: '#d33',
  },
});
