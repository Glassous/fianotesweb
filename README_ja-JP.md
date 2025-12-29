# Fianotes Web

[English](./README.md) | [简体中文](./README_zh-CN.md) | [繁體中文](./README_zh-TW.md) | [日本語](./README_ja-JP.md)

Fianotes Web は、Markdown メモを美しいインターフェースで表示するために設計された、セルフホスト型の Web ベースのメモ作成プラットフォームです。AI アシスタント（Copilot）、構文ハイライト、および GitHub とのシームレスな統合によるリアルタイムのメモ保存と検索機能を備えています。

## 機能

- **リアルタイム GitHub 統合**: GitHub API を使用して、プライベートまたはパブリック GitHub リポジトリから直接メモを取得してレンダリングします。コンテンツの更新にビルド手順は不要です。
- **Markdown レンダリング**: GFM（GitHub Flavored Markdown）、数式（KaTeX）、およびコードの構文ハイライトを完全にサポートします。
- **AI Copilot**: OpenAI を利用した統合 AI アシスタント（設定可能）が、メモの要約、説明、または拡張を支援します。
- **レスポンシブデザイン**: デスクトップとモバイルの両方の表示に最適化されています。
- **高速でモダン**: React、Vite、TypeScript で構築されています。

## 前提条件: GitHub トークン

アプリケーションがプライベートメモのリポジトリにアクセスできるようにするには、GitHub パーソナルアクセストークン（PAT）を生成する必要があります。このトークンは、アプリケーションがメモを「読み取る」ためのパスワードとして機能します。

1.  **GitHub Settings** > **Developer settings** > **Personal access tokens** に移動します。
2.  **Fine-grained tokens**（推奨）または **Tokens (classic)** を選択します。
    *   **Fine-grained tokens (より安全)**:
        *   **Generate new token** をクリックします。
        *   **Repository access**: "Only select repositories" を選択し、メモのリポジトリを選択します。
        *   **Permissions**: **Contents** を選択し、**Read-only** に設定します。
        *   **Metadata**: これは通常必須であり、自動的に **Read-only** に設定されます。
    *   **Tokens (classic)**:
        *   **Generate new token (classic)** をクリックします。
        *   **Scopes**: メモのリポジトリがプライベートの場合、`repo` スコープ（プライベートリポジトリの完全な制御）をチェックする必要があります。クラシックトークンにはプライベートリポジトリ用の「読み取り専用」スコープがないため、このトークンは慎重に扱ってください。
3.  **生成されたトークンをコピーします**。これは `NOTES_PAT` 設定変数で使用します。

## 設定

アプリケーションは環境変数を使用して設定されます。ローカル開発用の `.env` ファイル、またはデプロイプラットフォームのダッシュボードでこれらを設定できます。

| 変数名 | 説明 | 必須 |
|----------|-------------|----------|
| `NOTES_REPO_PATH` | メモを含む GitHub リポジトリのパス（例: `username/my-notes`）。 | はい |
| `NOTES_PAT` | メモのリポジトリにアクセスするための GitHub パーソナルアクセストークン（repo スコープが必要）。 | はい |
| `VITE_OPENAI_BASE_URL` | OpenAI API のベース URL（デフォルト: `https://api.openai.com/v1`）。 | いいえ |
| `VITE_OPENAI_API_KEY` | Copilot 機能用の OpenAI API キー。 | いいえ |
| `VITE_OPENAI_MODEL` | 使用する AI モデル（デフォルト: `gpt-5`）。 | いいえ |
| `VITE_ENABLE_AI_PASSWORD` | AI パスワード保護を有効にします（デフォルト: `false`）。 | いいえ |
| `VITE_ENABLE_HASH_PASSWORD` | パスワードの SHA-256 ハッシュチェックを有効にします（デフォルト: `false`）。パスワードファイルにハッシュが含まれている場合は `true` に設定します。 | いいえ |

*注: `VITE_OPENAI_BASE_URL` または `VITE_OPENAI_MODEL` が指定されていない場合、それぞれ OpenAI の公式 API と `gpt-5` がデフォルトになります。*

## AI ロック（パスワード保護）

ノートブックの AI 機能をパスワードで保護できます。これは、メモを公開したいが、AI の使用（API クォータを消費するため）を自分だけに制限したい場合に便利です。

1.  **パスワード保護の有効化**: 環境変数 `VITE_ENABLE_AI_PASSWORD=true` を設定します。
2.  **検証モードの選択**:
    *   **ハッシュモード（推奨）**: `VITE_ENABLE_HASH_PASSWORD=true` を設定します。システムはパスワードファイル内のコンテンツが SHA-256 ハッシュであることを期待します。
    *   **プレーンテキストモード**: `VITE_ENABLE_HASH_PASSWORD=false`（デフォルト）を設定します。システムはプレーンテキストのパスワードを直接比較します。
3.  GitHub メモリポジトリの **ルートディレクトリ** または **`public/` フォルダ** に `password.fianotes` という名前のファイルを作成します。
4.  手順 2 の選択に基づいて、このファイルに内容を書き込みます。
    *   **ハッシュモード**を使用する場合、パスワードの SHA-256 ハッシュを書き込みます。[オンラインツール](https://sha256.fiacloud.top) またはコマンドライン（例: `echo -n "yourpassword" | sha256sum`）を使用して生成できます。
    *   **プレーンテキストモード**を使用する場合、パスワードを直接書き込みます。
5.  ファイルをコミットします。

`VITE_ENABLE_AI_PASSWORD` が true でパスワードファイルが存在する場合、AI サイドバーはパスワードを要求します。`VITE_ENABLE_AI_PASSWORD` が false の場合、パスワードファイルは無視されます。

**ファイルの場所に関する注意:**
- **GitHub メモリポジトリのルートディレクトリ**: 設定が最も簡単です。
- **`public/` フォルダ**: GitHub メモリポジトリのルートディレクトリを整理しておきたい場合、またはメモサイト自体をデプロイしており、パスワードファイルを静的に提供したい場合に便利です。

> **優先順位**: GitHub メモリポジトリのルートディレクトリと `public/` フォルダの両方に `password.fianotes` ファイルが存在する場合、**GitHub メモリポジトリのルートディレクトリ** にあるパスワードファイルが優先されます。

## ローカル開発

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/Glassous/fianotesweb.git
   cd fianotesweb
   ```

2. **依存関係をインストール**
   ```bash
   npm install
   ```

3. **環境設定**
   `.env.example` を `.env.local` にコピーし、詳細を入力します。
   ```bash
   cp .env.example .env.local
   ```
   `.env.local` を編集し、`NOTES_REPO_PATH`、`NOTES_PAT`、およびオプションの OpenAI 設定を追加します。

4. **開発サーバーの起動**
   ```bash
   npm run dev
   ```
   http://localhost:5173 を開いてアプリを表示します。

## デプロイ

Fianotes Web は GitHub API を介してリアルタイムでメモを取得するため、メモを更新するたびにアプリケーションを再構築する必要はありません。

### ローカルデプロイ

本番用バージョンをローカルで実行するには:

1.  **アプリケーションのビルド**:
    ```bash
    npm run build
    ```
2.  **ローカルプレビュー**:
    ```bash
    npm run preview
    ```
    または、任意の静的ファイルサーバー（`serve`、`nginx` など）を使用して `dist` フォルダを提供します。

### GitHub Pages

GitHub Pages にデプロイするには、GitHub Actions を使用できます。

1. GitHub のリポジトリページに移動します。
2. **Settings** > **Secrets and variables** > **Actions** に移動します。
3. 以下のリポジトリシークレット（Repository secrets）を追加します:
   - `NOTES_REPO_PATH`
   - `NOTES_PAT`
   - `VITE_OPENAI_API_KEY`（オプション）
   - `VITE_OPENAI_BASE_URL`（オプション）
   - `VITE_OPENAI_MODEL`（オプション）
4. `.github/workflows/deploy.yml` という名前のファイルを作成し、以下の内容を記述します:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          NOTES_REPO_PATH: ${{ secrets.NOTES_REPO_PATH }}
          NOTES_PAT: ${{ secrets.NOTES_PAT }}
          VITE_OPENAI_API_KEY: ${{ secrets.VITE_OPENAI_API_KEY }}
          VITE_OPENAI_BASE_URL: ${{ secrets.VITE_OPENAI_BASE_URL }}
          VITE_OPENAI_MODEL: ${{ secrets.VITE_OPENAI_MODEL }}
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

5. **Settings** > **Pages** に移動し、"Build and deployment" のソースが **GitHub Actions** に設定されていることを確認します。

### Cloudflare Pages

1. Cloudflare ダッシュボードにログインし、**Workers & Pages** に移動します。
2. **Create Application** > **Pages** > **Connect to Git** をクリックします。
3. リポジトリを選択します。
4. ビルド設定を構成します:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. **Environment variables** の下で、以下を追加します:
   - `NOTES_REPO_PATH`
   - `NOTES_PAT`
   - `VITE_OPENAI_API_KEY`
   - `VITE_OPENAI_BASE_URL`（オプション）
   - `VITE_OPENAI_MODEL`（オプション）
6. **Save and Deploy** をクリックします。

### Vercel

1. Vercel にログインし、**Add New** > **Project** をクリックします。
2. リポジトリをインポートします。
3. **Configure Project** ステップで:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment variables** を展開し、以下を追加します:
   - `NOTES_REPO_PATH`
   - `NOTES_PAT`
   - `VITE_OPENAI_API_KEY`
   - `VITE_OPENAI_BASE_URL`（オプション）
   - `VITE_OPENAI_MODEL`（オプション）
5. **Deploy** をクリックします。

## ライセンス

このプロジェクトは Apache License 2.0 ライセンスの下でライセンスされています。詳細については、[LICENSE](./LICENSE) ファイルを参照してください。
