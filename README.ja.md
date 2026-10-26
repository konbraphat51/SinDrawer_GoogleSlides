# SinDrawer for Google スライド

[English version](README.md)

[SinDrawer](https://github.com/konbraphat51/SinDrawer) を Google スライドで使えるようにした Chrome 拡張機能です。
スライドタイトルから同じ正弦波アートを描き、ワンクリックでスライドの背景に設定します。

- **ワンクリック**: プレゼンテーションを開いて拡張機能アイコンをクリックし、**このスライドに適用** か **全スライドに適用** を押します。
- **SinDrawer と同じアルゴリズム**: XorShift によるシード、ランダムな正弦波の合成、4 種類の配置（右側塗りつぶし・右上塗りつぶし・上部ライン・上部塗りつぶし）をそのまま移植しています。出力頂点がオリジナルと完全に一致することをユニットテストで確認しています。
- **スライドタイトルがシード**: オリジナルでスライドタイトルを入力していたのと同じく、各スライドのタイトルが波のシードになります。**全スライドに適用** ではスライドごとに異なる波になり、同じタイトルのスライドは同じ波になります。
- **ライブプレビュー**: 色・配置・軸位置・振幅・背景・解像度を調整できます。設定は保存されます。
- **コピー / ダウンロード**: Google アカウントを接続しなくても PNG を取得できます。
- UI は英語と日本語に対応しています（既定はブラウザの言語。ポップアップで切り替え可能）。

## セットアップ（`git clone` から）

必要なもの: Node.js 20 以上、[pnpm](https://pnpm.io/) 10 以上、Google Chrome。

### 1. ビルドして拡張機能を読み込む

```sh
git clone https://github.com/konbraphat51/SinDrawer_GoogleSlides.git
cd SinDrawer_GoogleSlides
pnpm install
cp .env.example .env
pnpm build
```

1. `chrome://extensions` を開き、**デベロッパー モード** をオンにします。
2. **パッケージ化されていない拡張機能を読み込む** をクリックし、`dist/` フォルダを選びます。
3. 拡張機能カードに表示される **ID** を控えます。次の手順で使います。

この時点でプレビュー・コピー・ダウンロードは使えます。背景の適用には OAuth クライアントが必要です。

### 2. Google OAuth クライアントを作成する（初回のみ）

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成するか、既存のものを選びます。
2. **API とサービス → ライブラリ** で **Google Slides API** と **Google Drive API** を有効にします。
3. **API とサービス → OAuth 同意画面**（Google Auth Platform）で:
   - **外部**（Workspace 内だけで使うなら **内部**）を選び、必須項目を入力します。
   - スコープ `.../auth/presentations` と `.../auth/drive.file` を追加します。
   - テスト中は **テストユーザー** に自分の Google アカウントを追加します。
4. **API とサービス → 認証情報 → 認証情報を作成 → OAuth クライアント ID** で:
   - アプリケーションの種類: **Chrome 拡張機能**
   - アイテム ID: 手順 1 で控えた拡張機能 ID
5. クライアント ID を `.env` に書きます:

   ```sh
   GOOGLE_OAUTH_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
   ```

6. もう一度 `pnpm build` を実行し、`chrome://extensions` で拡張機能カードの再読み込みボタンを押します。

> パッケージ化されていない拡張機能の ID はフォルダのパスで決まります。フォルダを移動したり別の PC で使ったりすると ID が変わり、OAuth クライアントと一致しなくなります。
> ID を固定するには、`.env` の `EXTENSION_KEY` に公開鍵を設定してください（[Chrome ドキュメント: 拡張機能 ID を固定する](https://developer.chrome.com/docs/extensions/reference/manifest/key)）。

### 3. 使う

1. `docs.google.com/presentation/...` のプレゼンテーションを開き、スライドを選びます。
2. SinDrawer アイコンをクリックします。初回は **Google アカウントを接続** を押してアクセスを許可します。サインイン中にポップアップが閉じた場合は、もう一度開いてください。
3. プレビューを見ながら見た目を調整し、**このスライドに適用** か **全 N 枚のスライドに適用** を押します。数秒でエディタに背景が反映されます。

## 2 回目以降の実行

- コードを変更したら: `pnpm build`（または `pnpm watch` を起動したまま）を実行し、`chrome://extensions` で拡張機能を再読み込みします。
- 使うだけなら: 起動するものはありません。Google スライドを開いて拡張機能アイコンをクリックするだけです。

## 主な CLI

| コマンド         | 内容                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `pnpm install`   | 依存関係をインストール                                                                                       |
| `pnpm build`     | 型チェックをして `dist/` に拡張機能をビルド                                                                  |
| `pnpm watch`     | 変更のたびに `dist/` を再ビルド（開発モード、ソースマップ付き）                                              |
| `pnpm dev`       | UI 開発用に `http://localhost:5173/Popup/Popup.html` でポップアップを配信（スタンドアロン、Google API なし） |
| `pnpm test`      | ユニットテスト（Vitest）                                                                                     |
| `pnpm lint`      | ESLint による静的解析                                                                                        |
| `pnpm typecheck` | `vue-tsc` による型チェック                                                                                   |
| `pnpm format`    | Prettier で整形                                                                                              |
| `pnpm icons`     | `Public/Icons/*.png` を再生成                                                                                |

## 適用の仕組みと制限

Slides API は背景画像を公開 URL でしか受け付けません。画像を渡すために、拡張機能は次のことを行います。

1. PNG をローカルで描画する
2. あなたの Drive にアップロードする（`drive.file` スコープなので、拡張機能が作成したファイルしか見えません）
3. Slides が画像をコピーする数秒間だけ「リンクを知っている全員」に共有する
4. すぐに削除する

Google Workspace の管理者がリンク共有を禁止している場合、適用はわかりやすいメッセージとともに失敗します。
その場合は **画像をコピー** か **PNG をダウンロード** を使い、**スライド → 背景を変更 → 画像を選択** から手動で設定してください。

設計は [Docs/Architecture.ja.md](Docs/Architecture.ja.md) を参照してください。

## ライセンス

[Boost Software License 1.0](LICENSE)
