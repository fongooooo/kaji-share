import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/state/auth-context';

export default function LoginScreen() {
  const { user, initializing, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // すでにログイン済みならこの画面を出さない（ペアリング済みかどうかは "/" 側で判定する）
  if (!initializing && user) {
    return <Redirect href="/" />;
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signIn') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, name.trim());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '認証に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          kaji-share
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {mode === 'signIn' ? 'ログイン' : '新規登録'}
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.form}>
          {mode === 'signUp' && (
            <TextInput
              placeholder="お名前"
              value={name}
              onChangeText={setName}
              style={styles.input}
              autoCapitalize="none"
            />
          )}
          <TextInput
            placeholder="メールアドレス"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="パスワード"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />

          {error && (
            <ThemedText type="small" themeColor="text" style={styles.error}>
              {error}
            </ThemedText>
          )}

          <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
            <ThemedText type="smallBold" themeColor="background">
              {submitting ? '処理中...' : mode === 'signIn' ? 'ログイン' : '登録する'}
            </ThemedText>
          </Pressable>
        </ThemedView>

        <Pressable onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
          <ThemedText type="link" themeColor="textSecondary">
            {mode === 'signIn' ? 'アカウントをお持ちでない方はこちら' : 'すでにアカウントをお持ちの方はこちら'}
          </ThemedText>
        </Pressable>
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
    fontSize: 32,
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
  },
  error: {
    color: '#d33',
  },
  submitButton: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
