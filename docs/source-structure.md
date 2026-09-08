# ソース構成

## ディレクトリツリー

```
src/
├── app/                    # 画面（expo-router によるファイルベースルーティング）
│   ├── _layout.tsx         # ルートレイアウト（ナビゲーション・プロバイダの初期化）
│   ├── index.tsx           # タスク一覧画面（ホーム）
│   ├── login.tsx           # ログイン・新規登録画面
│   ├── pair.tsx            # ペア設定画面
│   └── task-edit.tsx       # タスク登録・編集画面（モーダル）
├── components/             # 共通UIコンポーネント
│   ├── themed-text.tsx     # テーマ対応テキスト
│   └── themed-view.tsx     # テーマ対応ビュー
├── constants/              # アプリ全体で使う定数
│   └── theme.ts            # カラー・フォント・スペーシング定数
├── hooks/                  # カスタムフック
│   ├── use-color-scheme.ts     # カラースキーム取得（ネイティブ）
│   ├── use-color-scheme.web.ts # カラースキーム取得（Web 用の別実装）
│   └── use-theme.ts            # 現在のテーマオブジェクトを返す
├── lib/                    # Firebase アクセス層（ビジネスロジック）
│   ├── firebase.ts         # Firebase 初期化・auth / db インスタンスのエクスポート
│   ├── couples.ts          # ペア（couples コレクション）の読み書き
│   └── tasks.ts            # タスク（tasks サブコレクション）の読み書き
├── state/                  # グローバル状態管理
│   └── auth-context.tsx    # 認証状態・ユーザープロフィールの Context
├── types/                  # 型定義
│   └── models.ts           # Firestore ドキュメントに対応するデータ型
└── global.css              # グローバルスタイル（Web 向け）
```

---

## 各ファイルの役割

### app/ — 画面

| ファイル | 役割 |
|---|---|
| `_layout.tsx` | アプリ全体のルートレイアウト。`ThemeProvider`・`AuthProvider` を設定し、画面スタックを定義する |
| `index.tsx` | タスク一覧画面（ホーム）。週/月タブで切り替え、チェックで完了操作を行う。未ログイン→`/login`、未ペア→`/pair` へリダイレクト |
| `login.tsx` | ログイン・新規登録画面。`signIn` / `signUp` を切り替えて Firebase Auth に送信する |
| `pair.tsx` | ペア設定画面。招待コードの発行（`createCouple`）または入力（`joinCoupleByInviteCode`）でパートナーと紐付ける |
| `task-edit.tsx` | タスク登録・編集画面（モーダル表示）。URL パラメータ `id` の有無で新規/編集を切り替える |

### components/ — 共通UIコンポーネント

| ファイル | 役割 |
|---|---|
| `themed-text.tsx` | `type` prop でフォントスタイル（`title`・`small` など）、`themeColor` prop で文字色をテーマから指定できる `Text` ラッパー |
| `themed-view.tsx` | `type` prop で背景色をテーマから指定できる `View` ラッパー |

### constants/ — 定数

| ファイル | 役割 |
|---|---|
| `theme.ts` | ライト/ダークの `Colors`、`Fonts`（プラットフォーム別フォント名）、`Spacing`（4px 基準のスペーシングスケール）、`MaxContentWidth` などを定義 |

### hooks/ — カスタムフック

| ファイル | 役割 |
|---|---|
| `use-color-scheme.ts` | React Native の `useColorScheme` をラップして現在のカラースキームを返す |
| `use-color-scheme.web.ts` | Web 向けの別実装（メディアクエリを使った実装） |
| `use-theme.ts` | `useColorScheme` を使って `Colors.light` or `Colors.dark` のどちらかを返す |

### lib/ — Firebase アクセス層

| ファイル | 役割 |
|---|---|
| `firebase.ts` | Firebase アプリを初期化し、`auth`・`db` インスタンスをエクスポートする。ネイティブは `AsyncStorage` でセッション永続化、Web はブラウザの `localStorage` を使う |
| `couples.ts` | `createCouple`（ペア作成・招待コード発行）、`joinCoupleByInviteCode`（招待コードでペア参加）、`subscribeCoupleMemberUids`（メンバーUID のリアルタイム購読）を提供する |
| `tasks.ts` | `subscribeTasks`（タスク一覧のリアルタイム購読）、`getTask`（単件取得）、`createTask`・`updateTask`（登録/更新）、`setTaskStatus`（完了/未完了の切り替え）を提供する |

### state/ — グローバル状態管理

| ファイル | 役割 |
|---|---|
| `auth-context.tsx` | `AuthProvider` が Firebase Auth の状態変化を購読し、`user`・`profile`・`initializing` と `signIn`・`signUp`・`signOut` を Context 経由でアプリ全体に提供する。`profile` は Firestore の `users/{uid}` をリアルタイム購読して取得する |

### types/ — 型定義

| ファイル | 役割 |
|---|---|
| `models.ts` | Firestore ドキュメントに対応する型（`Task`・`UserProfile`）と列挙型（`TaskFrequency`・`TaskStatus`）を定義する |

---

## データの流れ（概略）

```
Firebase Auth / Firestore
        ↓
  lib/firebase.ts（初期化・インスタンス）
        ↓
  lib/couples.ts / lib/tasks.ts（アクセス関数）
        ↓
  state/auth-context.tsx（認証・プロフィールを Context に保持）
        ↓
  app/*.tsx（画面が useAuth() や lib/ の関数を呼び出してUIを構築）
```
