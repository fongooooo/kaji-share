# 技術スタック

## 言語

| 言語 | バージョン | 用途 |
|---|---|---|
| TypeScript | ~6.0.3 | アプリ全体（strict モード有効） |

### TypeScript 設定のポイント（`tsconfig.json`）
- `strict: true` — 型チェックを最大限有効化
- パスエイリアス `@/*` → `./src/*`、`@/assets/*` → `./assets/*`

---

## フロントエンド

### React Native / Expo

| パッケージ | バージョン | 役割 |
|---|---|---|
| `react` | 19.2.3 | UIライブラリ |
| `react-native` | 0.86.3 | クロスプラットフォームUIフレームワーク |
| `expo` | ~57.0.20 | Expo SDK本体（ビルド・開発環境） |
| `expo-router` | ~57.0.19 | ファイルベースルーティング（`src/app/` 配下の構成） |
| `expo-splash-screen` | ~57.0.8 | スプラッシュスクリーン制御 |
| `expo-status-bar` | ~57.0.1 | ステータスバー制御 |
| `expo-constants` | ~57.0.17 | アプリ定数（バージョンなど）へのアクセス |
| `expo-device` | ~57.0.1 | デバイス情報の取得 |
| `expo-font` | ~57.0.3 | カスタムフォントの読み込み |
| `expo-linking` | ~57.0.9 | ディープリンク処理 |
| `expo-web-browser` | ~57.0.2 | インアプリブラウザ |
| `expo-clipboard` | ~57.0.1 | クリップボードへのコピー（招待コードのコピー機能） |

### UI補助

| パッケージ | バージョン | 役割 |
|---|---|---|
| `@expo/ui` | ~57.0.16 | Expo 提供のUIコンポーネント集 |
| `expo-image` | ~57.0.4 | 高性能な画像コンポーネント |
| `expo-glass-effect` | ~57.0.1 | ガラスエフェクトUI |
| `expo-symbols` | ~57.0.2 | SF Symbols / Material Icons対応のアイコン |
| `expo-system-ui` | ~57.0.3 | ナビゲーションバー・ステータスバーの背景色制御 |
| `react-native-safe-area-context` | ~5.7.0 | SafeAreaView（ノッチ・ホームバー対応） |
| `react-native-screens` | ~4.26.0 | ネイティブスクリーンコンポーネント（expo-router の依存） |
| `react-native-gesture-handler` | ~2.32.0 | ジェスチャー認識（expo-router の依存） |
| `react-native-reanimated` | 4.5.1 | アニメーション |
| `react-native-worklets` | 0.10.1 | JS スレッド外でのワークレット実行（Reanimated の依存） |

### Web対応

| パッケージ | バージョン | 役割 |
|---|---|---|
| `react-dom` | 19.2.3 | Web レンダリング |
| `react-native-web` | ~0.21.0 | React Native コンポーネントを Web 向けに変換 |

### データ永続化（ローカル）

| パッケージ | バージョン | 役割 |
|---|---|---|
| `@react-native-async-storage/async-storage` | ^3.1.1 | ネイティブのキーバリューストレージ（Firebase Auth のセッション永続化に使用） |

---

## バックエンド（Firebase）

| パッケージ | バージョン | 役割 |
|---|---|---|
| `firebase` | ^12.18.0 | Firebase SDK（Auth・Firestore を使用） |

### 使用している Firebase サービス

| サービス                          | 用途                           |
| ----------------------------- | ---------------------------- |
| Firebase Authentication       | メールアドレス＋パスワード認証              |
| Cloud Firestore               | ユーザー・ペア・タスクデータの保存とリアルタイム購読   |
| Firebase Hosting              | Web版（iPhone向け）の配信            |
| Firebase Cloud Messaging（FCM） | タスク完了時の相手へのプッシュ通知（次フェーズ実装予定） |

---

## ビルド・配布（EAS）

EAS（Expo Application Services）を使用してビルド・配布を管理する（`eas.json`）。

| プロファイル | 内容 |
|---|---|
| `development` | 開発用クライアントビルド（internal 配布） |
| `preview` | 動作確認用 APK ビルド（Android・internal 配布） |
| `production` | 本番ビルド（バージョン自動インクリメント） |

- EAS CLI バージョン要件: `>= 13.0.0`
- アプリバージョン管理: `remote`（EAS 側で管理）
- `eas-cli`・`firebase-tools` はプロジェクトの依存パッケージには含めず、`npx eas-cli`・`npx firebase-tools` の形でその都度実行する

### Web配布（Firebase Hosting）

iPhone側はネイティブアプリを配布せず、Web版をFirebase Hostingで配信する。

1. `npx expo export --platform web` で `dist/` に静的ファイルを出力
2. `npx firebase-tools deploy --only hosting` でデプロイ（設定は `firebase.json` / `.firebaserc`）

---

## 開発ツール

| パッケージ / ツール | バージョン | 役割 |
|---|---|---|
| `eslint` | ^9.0.0 | 静的解析 |
| `eslint-config-expo` | ~57.0.2 | Expo 向け ESLint ルールセット |
| `@expo/ngrok` | ^4.1.3 | ローカル開発サーバーの外部公開（実機確認用） |
| `@types/react` | ~19.2.2 | React の型定義 |

---

## Expo 実験的機能（有効化済み）

`app.json` の `experiments` で以下を有効化している。

| 機能 | 説明 |
|---|---|
| `typedRoutes` | expo-router の画面パスに型安全を提供する |
| `reactCompiler` | React Compiler（自動メモ化）を有効化 |

---

## アプリ設定（`app.json` 抜粋）

| 項目 | 値 |
|---|---|
| アプリ名 | kaji-share |
| slug | kaji-share |
| バージョン | 1.0.0 |
| 画面向き | portrait（縦固定） |
| カラーモード | automatic（ライト/ダーク自動） |
| Android パッケージ名 | com.takuyahongo.kajishare |
| Web 出力形式 | static |
| ディープリンクスキーム | kajishare:// |
