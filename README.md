# Communicator Playground (unofficial community edition)

[English](#english) | [日本語](#日本語)

| Customizer | Back (sloped 3D view) | Screen simulator |
|---|---|---|
| ![](docs/images/customize-front.png) | ![](docs/images/customize-back.png) | ![](docs/images/simulator.png) |

<a id="english"></a>

A web page for trying on Clicks Communicator exteriors and testing app behavior inside a mock screen, plus notes for developers.

> An unofficial community project, not affiliated with Clicks Technology.
> Dimensions come from the published specs (130.5 × 78.63 × 12 mm, 4.03-inch 1080 × 1200) and measurements of official product images ([measurements and sources](docs/measurements.md), in Japanese). Side-key functions and colors are estimates.

More background (device specs, FAQ summary, how the mock is built) is in the [Wiki](https://github.com/daikiito-dk/communicator-playground/wiki).

## Try it

**Live page: https://daikiito-dk.github.io/communicator-playground/**

No build step is needed to run it locally. Any static file server works.

```bash
cd web
python3 -m http.server 8765
# open http://localhost:8765
```

## Features

The UI is available in English, Japanese, French and Spanish. Switch from the menu at the top right, or open the page with `#lang=en` (`ja` / `fr` / `es`). Without that, the page uses your last choice, then your browser language. Messages and dates inside the simulator follow the selected language.

### Customizer

- Combine the 3 body colors with the 10 back covers on sale (Cognac, Surf, Miami Beach, Dune, Spice, Clover, Vino, Onyx, Surge, Bloom)
- 12 mm thick 3D view with the measured back slope, raised display and keys, and a screen reflection that follows the rotation. Drag to rotate, or jump to front / back / left / right / top
- Power key, headphone jack, side keys, kill switch, Signal LED and USB-C at their measured positions
- Keyboard layouts: QWERTY, AZERTY, QWERTZ
- Save and share a configuration in the URL (for example `#body=clover&cover=bloom&view=left`; view is front / back / left / right / top)

### Screen simulator

- Mock OS: lock screen, Message hub, chats and notes. The lock screen follows the official product image (clock, date, next event and per-app notifications) and also appears in the customizer
- Use the on-screen keys or your computer keyboard (J / K, Enter, Esc and so on)
- Sending a notification blinks the Signal LED in the contact's color
- alt / 123 types the symbol or number printed above a key; the kill switch on the left turns the mic off
- Change the Clicks Key action; hold the side key to simulate voice input
- Scroll with the mouse wheel over the keyboard (the keyboard is touch-sensitive)
- Switch screen density and font size to check layouts in dp
- Load any URL (such as a local dev server) inside the mock screen

## Layout

```
web/                  Web page (plain HTML / CSS / JS, no build)
  js/i18n.js          UI strings and language switching (EN / JA / FR / ES)
  js/catalog.js       Body colors, covers, keyboard layouts, accessories
  js/device.js        Device mock drawing (shared by both tabs)
  js/lockscreen.js    Start (lock) screen (shared by both tabs)
  js/customizer.js    Customizer
  js/simulator.js     Screen simulator
avd/                  Android Studio hardware profile and AVD script
tools/                Emulator skin generator
docs/                 Keyboard-first checklist, Japanese input guide, measurements
```

## Roadmap

| Stage | What | Already in place |
|---|---|---|
| Accuracy | Update dimensions, camera position and colors from a real device; move to real 3D (glTF) and AR | Dimensions are mm constants in one place |
| Accessory sales / ordering | Add SKUs, prices and stock to the catalog and connect to a store cart (Shopify, etc.) or a quote request | Product data lives in `catalog.js`; configurations travel in the URL; a disabled "Order" button is in place |
| Enterprise desktop app | Wrap the same web code in Electron or Tauri as an offline simulator | No external libraries or build steps, so it can be wrapped as is |

Before selling or distributing anything, get permission from Clicks for its name, logo and product images. The same applies to third-party accessories such as dbrand.

## Contributing

Reports from people with a real device are especially welcome. Use the [issue templates](https://github.com/daikiito-dk/communicator-playground/issues/new/choose).

- **Device measurements and screen info:** screen density (`adb shell wm density`), camera and key positions, etc.
- **Japanese input results:** how each IME works ([Japanese input guide](docs/japanese-input-guide.md))
- **Bugs and ideas:** for the web page or scripts

Please do not post confidential pre-release information (anything under NDA) or copies of official Clicks images.

Pushing to `main` publishes `web/` to GitHub Pages automatically (`.github/workflows/pages.yml`).

## License

[MIT](LICENSE). Clicks and Communicator names and trademarks belong to Clicks Technology.

## Known limitations

- Screen, keys, punch hole, speakers and side keys are measured from product images (about ±0.5–1 mm). Side-key functions, colors and finishes are estimates.
- Sites that block embedding (`X-Frame-Options`, etc.) cannot be shown in the simulator.
- Japanese conversion input is not reproduced in the mock OS (keys typed while your computer's IME is composing are ignored).
- Korean and Arabic keyboard layouts, which Clicks also offers, are not in the mock yet.

---

<a id="日本語"></a>

# Communicator Playground（非公式コミュニティ版）

Clicks Communicator の外装を着せ替えて見たり、モック画面の中でアプリの動きを試したりできる Web ページと、開発者向けの資料をまとめたものです。

> 非公式のコミュニティ制作物です。Clicks Technology とは関係ありません。
> 寸法は公開値（130.5 × 78.63 × 12 mm、4.03 インチ 1080 × 1200）と、公式の製品画像からの計測値です（[計測値と出典](docs/measurements.md)）。側面キーの役割と色は推定です。

端末の仕様、FAQ の要点、モックの作り方などは [Wiki](https://github.com/daikiito-dk/communicator-playground/wiki) にまとめています。

## すぐに試す

**公開ページ: https://daikiito-dk.github.io/communicator-playground/**

手元で動かす場合も、ビルドは不要です。静的ファイルを配信するだけで動きます。

```bash
cd web
python3 -m http.server 8765
# ブラウザで http://localhost:8765 を開く
```

## できること

表示言語は英語・日本語・フランス語・スペイン語に対応しています。右上で切り替えるか、URL に `#lang=en`（`ja` / `fr` / `es`）を付けて開きます。指定がなければ前回の選択、次にブラウザの言語を使います。シミュレーター内のメッセージや日付も選んだ言語で表示します。

### 外装カスタマイズ

- 本体カラー 3 色と、販売中の背面カバー 10 色（Cognac、Surf、Miami Beach、Dune、Spice、Clover、Vino、Onyx、Surge、Bloom）の組み合わせを切り替え
- 厚み 12 mm の立体表示。背面の傾斜は計測値どおりで、ディスプレイとキーの盛り上がり、回転に合わせて動く画面の映り込みも表現。ドラッグで回転、前面・背面・左右の側面・上面の切り替え
- 側面の電源キー、イヤホンジャック、サイドキー、キルスイッチ、Signal LED、USB-C を実寸の位置に表示
- キーボード配列（QWERTY / AZERTY / QWERTZ）の切り替え
- 構成を URL に保存して共有（例: `#body=clover&cover=bloom&view=left`。view は front / back / left / right / top）

### 画面シミュレーター

- モック OS: ロック画面、Message hub、会話、メモ。ロック画面は公式の製品画像にならい、時計・日付・予定とアプリごとの通知を並べます（外装カスタマイズの画面にも表示）
- 画面のキー、または PC のキーボードで操作（J / K、Enter、Esc など）
- 通知を送ると Signal LED が相手ごとの色で点滅
- alt / 123 キーで上段の記号・数字を入力、左側面のキルスイッチでマイクをオフ
- Clicks Key の割り当て変更、サイドキー長押しでの音声入力の再現
- キーボード面でのホイール操作でスクロール（タッチ式キーボードの再現）
- 画面密度と文字サイズを切り替えて、dp サイズでの見え方を確認
- 任意の URL（ローカルの開発サーバーなど）をモック画面の中に表示

## 構成

```
web/                  Web ページ（ビルド不要の HTML / CSS / JS）
  js/i18n.js          表示言語（英語・日本語・フランス語・スペイン語）の文言と切り替え
  js/catalog.js       本体色、カバー、配列、アクセサリーのデータ
  js/device.js        端末モックの描画部品（両タブで共通）
  js/lockscreen.js    開始画面（ロック画面）の描画（両タブで共通）
  js/customizer.js    外装カスタマイズ
  js/simulator.js     画面シミュレーター
avd/                  Android Studio 用のハードウェアプロファイルと AVD 作成スクリプト
tools/                エミュレーター用スキンの生成スクリプト
docs/                 キーボード優先の開発チェックリスト、日本語入力ガイド、計測値
```

## 今後の拡張

| 段階 | 内容 | 準備済みの部分 |
|---|---|---|
| 精度を上げる | 実機を実測して寸法、カメラ位置、色を更新。本格的な 3D（glTF）と AR 表示へ | 寸法は mm 単位の定数にまとめてあります |
| 関連商品の販売・発注 | 商品データに SKU、価格、在庫を追加し、EC（Shopify など）のカートや見積もり依頼につなぐ | 商品データは `catalog.js` に分離。構成は URL で受け渡しできます。「注文する」ボタンは無効のまま置いてあります |
| 法人向けデスクトップ版 | 同じ Web コードを Electron または Tauri で包み、オフラインで動くシミュレーターとして配布 | 外部ライブラリとビルド手順に依存しないので、そのまま包めます |

販売や配布を始める前に、Clicks の名称、ロゴ、製品画像の扱いについて Clicks から許諾を得る必要があります。dbrand などの他社アクセサリーを扱う場合も同じです。

## 参加するには

実機をお持ちの方の情報を特に募集しています。[Issue](https://github.com/daikiito-dk/communicator-playground/issues/new/choose) のテンプレートから投稿してください。

- **実機の寸法・画面情報の報告:** 画面密度（`adb shell wm density`）、カメラやキーの位置など。モックの精度を上げるのに使います
- **日本語入力の検証結果:** IME ごとの使い勝手。[日本語入力ガイド](docs/japanese-input-guide.md) にまとめます
- **不具合・改善の提案:** Web ページやスクリプトについて

発売前の機密情報（NDA の対象になっている情報）や、Clicks の公式画像の転載は投稿しないでください。

`main` に push すると、`web/` の内容が GitHub Pages に自動で公開されます（`.github/workflows/pages.yml`）。

## ライセンス

[MIT](LICENSE)。Clicks、Communicator の名称と商標は Clicks Technology に帰属します。

## 既知の制限

- 画面、キー、パンチホール、スピーカー、側面キーの位置は製品画像からの計測値です（誤差 ±0.5〜1 mm 程度）。側面キーの役割、色、質感は推定です。
- 埋め込みを禁止しているサイト（`X-Frame-Options` など）はシミュレーターに表示できません。
- 日本語の変換入力はモック OS では再現していません（PC 側で変換中のキー入力は無視します）。
- Clicks が提供している韓国語とアラビア語のキーボード配列は、モックにはまだありません。
