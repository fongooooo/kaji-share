import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/types/models';

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);
    });
  }, []);

  // usersドキュメントをリアルタイム購読することで、ペアリング完了(coupleIdの更新)を即座に画面へ反映する
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      const data = snapshot.data();
      if (!data) {
        // 認証は成功したがプロフィール作成に失敗した状態(通信エラー等)のセルフリカバリー
        setDoc(userRef, { name: user.displayName ?? '', coupleId: null, pushToken: null, createdAt: serverTimestamp() });
        return;
      }
      setProfile({ uid: user.uid, name: data.name, coupleId: data.coupleId ?? null, pushToken: data.pushToken ?? null });
    });
    // ログアウトやユーザー切り替え時は、次のeffectが動く前にここでprofileをクリアする
    return () => {
      unsubscribe();
      setProfile(null);
    };
  }, [user]);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(email: string, password: string, name: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await setDoc(doc(db, 'users', credential.user.uid), {
      name,
      coupleId: null,
      pushToken: null,
      createdAt: serverTimestamp(),
    });
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, profile, initializing, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
