# アーキテクチャ

[English](Architecture.md)

## 概要

Manifest V3 の Chrome 拡張機能で、2 つの実行コンテキストがあります。

| コンテキスト         | エントリ                          | 役割                                                                 |
| -------------------- | --------------------------------- | -------------------------------------------------------------------- |
| ポップアップ (Vue 3) | `Src/Popup/Main.ts` → `App.vue`   | UI、ライブプレビュー、設定の保存、コピー/ダウンロード                |
| Service Worker       | `Src/Background/ServiceWorker.ts` | OAuth、アクティブな Slides タブの読み取り、Google API 呼び出し、適用 |

両者は `Src/Core` の純粋な描画コードを共有します。時間のかかる API 処理は Service Worker で実行します。これにより、OAuth 同意画面などでポップアップが閉じても処理が途切れません。

```text
Src/
  Core/        SinDrawer から移植した純粋なアルゴリズム（DOM・chrome.* 非依存）
  Slides/      Google Slides / Drive 連携（Core に依存、トークン提供元は注入）
  Background/  Service Worker: コンポジションルート、chrome.identity、メッセージ振り分け
  Shared/      メッセージ契約、エラー型、OffscreenCanvas レンダラ
  Popup/       Vue ポップアップ: App.vue、Components/、Services/、Models/、Styles/
BuildTools/    vite.config.ts が使う manifest 生成
Public/        そのままコピーされる静的ファイル: _locales/、Icons/
Scripts/       開発用スクリプト（アイコン生成）
Tests/         Src/ と同じ構成の Vitest ユニットテスト
```

## 描画アルゴリズム (`Src/Core`)

オリジナルの `main.js` の `Draw()` を再現しています。`Tests/Core/Curve.test.ts` でオリジナルのコピーと頂点単位で比較しています。

```mermaid
flowchart LR
  T[スライドタイトル] -->|convertTextToSeed: 文字コードの和| S[seed]
  S -->|XorShift| W["Waveform.createRandomly<br/>(配置ごとの個数・振幅・角速度・位相の範囲)"]
  W -->|x = 0..対角線+16 でサンプリング| P[plots]
  P -->|scalePlotsToAmplitude| P2[スケール済み plots]
  P2 -->|projectPlotsAlongVector 配置の基準線に沿って| C[曲線の点列]
  C -->|塗りつぶし時は角を追加| SH[Shape]
  SH -->|renderBackground| IMG[Canvas / PNG]
```

- **配置プリセット** (`Placement.ts`) はオリジナルの定数をそのまま保持しています（乱数の範囲、基準線の始点と方向、閉じるための角、軸位置の既定値）。
- **解像度非依存**: 形状は幅 1280 px（オリジナルの既定幅）の論理座標で作り、高さはスライドの縦横比から決めます。`renderBackground` がこれを出力幅に合わせて拡大します。出力解像度を変えても見た目は変わらず、精細になるだけです。
- **線幅**: オリジナルは HotSoupScript の `DrawLine` に `3` を渡していますが、`ctx.line_width`（綴り違い）を設定しているため、実際の描画は 1 px です。移植版も出力を合わせるため 1 px で描きます。
- **完全一致**: ノルム計算は `Math.hypot` ではなく `(x ** 2 + y ** 2) ** 0.5` を使い、浮動小数点の結果までオリジナルと一致させています。

## クラス図

```mermaid
classDiagram
  direction LR

  class XorShift {
    +next() number
    +nextFloat() number
  }
  class Sinusoid {
    +amplitude
    +velocityAngular
    +phase
    +evaluate(x) number
  }
  class Waveform {
    +createRandomly(seed, parameters)$ Waveform
    +evaluate(x) number
    +sample(count) number[]
  }
  Waveform o-- Sinusoid
  Waveform ..> XorShift

  class ProviderToken {
    <<interface>>
    +getToken(isInteractive) Promise~string~
    +invalidateToken(token)
  }
  class ProviderTokenChrome
  ProviderToken <|.. ProviderTokenChrome

  class RendererImage {
    <<interface>>
    +renderPng(settings, seed, size) Promise~Blob~
  }
  class RendererImageOffscreen
  RendererImage <|.. RendererImageOffscreen

  class ClientGoogleApi {
    +request(url, init)
    +requestJson(url, init)
  }
  class ClientSlides {
    +getPresentation(id)
    +setBackgrounds(id, assignments)
  }
  class ClientDrive {
    +stageImage(png, name) ImageStaged
    +deleteFile(fileId)
  }
  class ApplierBackground {
    +apply(location, request) ResultApply
  }
  class HandlerMessage {
    +handle(message)
  }

  ClientGoogleApi --> ProviderToken
  ClientSlides --> ClientGoogleApi
  ClientDrive --> ClientGoogleApi
  ApplierBackground --> ClientSlides
  ApplierBackground --> ClientDrive
  ApplierBackground --> RendererImage
  HandlerMessage ..> ApplierBackground : creates
  HandlerMessage --> ProviderToken
  HandlerMessage --> RendererImage

  class BridgeExtension {
    <<interface>>
    +isAvailable
    +fetchContextSlide(isInteractive)
    +applyBackground(request)
  }
  class BridgeChrome
  class BridgeStandalone
  BridgeExtension <|.. BridgeChrome
  BridgeExtension <|.. BridgeStandalone
```

設計上のポイント:

- **依存性逆転**: `Slides/` のコードは `chrome.*` ではなく `ProviderToken` と `RendererImage` インターフェースに依存します。Service Worker が具体クラスを組み立て、テストではフェイクを注入します。
- **ブリッジ**: ポップアップは `BridgeExtension` を通してのみ Service Worker にアクセスします。`BridgeStandalone` を使うと、UI デバッグ用にポップアップを普通の Web ページとして動かせます（`pnpm dev`）。
- **設定のサニタイズ**: ストレージから読んだ値やメッセージで受け取った値は、すべて `normalizeSettings` / `normalizePreferences` を通します。

## シーケンス: ポップアップを開く

```mermaid
sequenceDiagram
  participant U as ユーザー
  participant P as ポップアップ (App.vue)
  participant SW as Service Worker
  participant C as chrome.identity
  participant S as Slides API

  U->>P: 拡張機能アイコンをクリック
  P->>P: 設定を読み込み (chrome.storage.local)
  P->>SW: fetchContextSlide(isInteractive=false)
  SW->>SW: アクティブタブの URL → presentationId, #slide=id.XXX
  SW->>C: getAuthToken(interactive=false)
  alt 未認可
    C-->>SW: エラー
    SW-->>P: notAuthorized
    P-->>U: 「Google アカウントを接続」ボタン
    U->>P: 接続をクリック
    P->>SW: fetchContextSlide(isInteractive=true)
    SW->>C: getAuthToken(interactive=true)（同意画面）
  end
  SW->>S: GET presentation (pageSize, スライドタイトル)
  SW-->>P: ContextSlide (タイトル、縦横比、スライド数)
  P-->>U: 現在のスライドタイトルをシードにしたプレビュー
```

## シーケンス: 背景を適用する

```mermaid
sequenceDiagram
  participant P as ポップアップ
  participant SW as Service Worker
  participant R as RendererImageOffscreen
  participant D as Drive API
  participant S as Slides API

  P->>SW: applyBackground(settings, scope, textSeedOverride)
  SW->>S: GET presentation
  SW->>SW: 対象スライドをシード（タイトルまたは上書き文字列）でグループ化
  loop 異なるシードごと（4 並列）
    SW->>R: renderPng(settings, seed, size)
    SW->>D: PNG をアップロード (multipart, drive.file)
    SW->>D: 権限 anyone/reader を付与
  end
  SW->>S: batchUpdate updatePageProperties.pageBackgroundFill（全スライドを一括・アトミック）
  S->>D: 画像を取得（Slides 側に複製が保存される）
  SW->>D: 一時ファイルを削除（finally で必ず実行）
  SW-->>P: countApplied
```

アップロードが 1 つでも失敗した場合、残りのアップロードは完了を待ち（`Promise.allSettled`）、作成したファイルはすべて削除します。公開状態のファイルは残りません。

## ビルド

`vite.config.ts` は、ポップアップ HTML とモジュール形式の Service Worker を 1 回の Rollup ビルドで生成します。`sindrawer-manifest` プラグインが `BuildTools/ManifestBuilder.ts` から `dist/manifest.json` を生成し、次の値を埋め込みます。

- `version`: `package.json` から
- `oauth2.client_id`: `.env` の `GOOGLE_OAUTH_CLIENT_ID` から（未設定ならプレースホルダーになり、ポップアップに設定方法が表示されます）
- `key`: 任意の `EXTENSION_KEY` から

## ローカライズ

`Public/_locales/{en,ja}/messages.json` が UI テキストの唯一の定義元です。Chrome は拡張機能の名前と説明に、これらのファイルを使います。ポップアップは `Translator` で両方のファイルをバンドルしており、拡張機能を再読み込みせずに言語を切り替えられます。`Tests/Popup/Translator.test.ts` で両カタログのキーが一致することを確認しています。
