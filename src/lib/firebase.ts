import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
// getReactNativePersistenceはReact Native向けの実装で実行時には存在するが、
// firebaseパッケージに同梱の型定義がWeb向けのため型上は見つからずエラーになる（既知のFirebase SDKの制約）
// @ts-expect-error - RN向けの型定義が firebase/auth のexportsに反映されていないため
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Firebaseコンソール > プロジェクト設定 > マイアプリ で発行される値を .env.local に設定する
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Webはブラウザのlocalstorageで永続化されるが、ネイティブ(iOS/Android)はAsyncStorageを明示しないとログイン状態が保持されない
export const auth =
  Platform.OS === 'web' ? getAuth(app) : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

export const db = getFirestore(app);
