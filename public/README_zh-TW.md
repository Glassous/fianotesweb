# Fianotes Web

[English](./README_en-US.md) | [简体中文](./README_zh-CN.md) | [繁體中文](./README_zh-TW.md) | [日本語](./README_ja-JP.md)

Fianotes Web 是一個自託管的 Web 筆記平台，旨在以精美的介面展示您的 Markdown 筆記。它具有 AI 輔助（Copilot）、語法高亮以及與 GitHub 無縫集成進行實時筆記存儲和檢索的功能。

## 功能特性

- **實時 GitHub 集成**：直接使用 GitHub API 從私有或公共 GitHub 倉庫獲取並渲染筆記。內容更新無需構建步驟。
- **Markdown 渲染**：全面支持 GFM（GitHub Flavored Markdown）、數學公式（KaTeX）和代碼語法高亮。
- **AI Copilot**：集成由 OpenAI 驅動的 AI 助手（可配置），幫助您總結、解釋或擴展筆記內容。
- **響應式設計**：針對桌面和移動設備進行了優化。
- **快速且現代**：基於 React、Vite 和 TypeScript 構建。

## 前置準備：GitHub Token

為了讓應用程序能夠訪問您的私有筆記倉庫，您需要生成一個 GitHub 個人訪問令牌（Personal Access Token, PAT）。該令牌充當應用程序「讀取」您筆記的密碼。

1.  進入 **GitHub Settings**（設置） > **Developer settings**（開發者設置） > **Personal access tokens**（個人訪問令牌）。
2.  選擇 **Fine-grained tokens**（細粒度令牌，推薦）或 **Tokens (classic)**（經典令牌）。
    *   **Fine-grained tokens (更安全)**:
        *   點擊 **Generate new token**。
        *   **Repository access**（倉庫訪問）：選擇 "Only select repositories"（僅選擇特定倉庫）並選擇您的筆記倉庫。
        *   **Permissions**（權限）：找到 **Contents**（內容）並將其設置為 **Read-only**（唯讀）。
        *   **Metadata**（元數據）：這通常是強制的，會自動設置為 **Read-only**。
    *   **Tokens (classic)**:
        *   點擊 **Generate new token (classic)**。
        *   **Scopes**（範圍）：如果您的筆記倉庫是私有的，您必須勾選 `repo` 範圍（對私有倉庫的完全控制）。經典令牌沒有針對私有倉庫的「唯讀」範圍，因此請妥善保管此令牌。
3.  **複製生成的令牌**。您將在配置 `NOTES_PAT` 變量時使用它。

## 配置

應用程序使用環境變量進行配置。您可以在本地開發的 `.env` 文件中設置這些變量，或者在部署平台的儀表板中進行設置。

| 變量名 | 描述 | 是否必須 |
|----------|-------------|----------|
| `NOTES_REPO_PATH` | 包含筆記的 GitHub 倉庫路徑（例如：`username/my-notes`）。 | 是 |
| `NOTES_PAT` | 用於訪問筆記倉庫的 GitHub 個人訪問令牌（Personal Access Token），需要 repo 權限。 | 是 |
| `VITE_OPENAI_BASE_URL` | OpenAI API 的基礎 URL（默認：`https://api.openai.com/v1`）。 | 否 |
| `VITE_OPENAI_API_KEY` | 用於 Copilot 功能的 OpenAI API 金鑰。 | 否 |
| `VITE_OPENAI_MODEL` | 使用的 AI 模型（默認：`gpt-5`）。 | 否 |
| `VITE_ENABLE_AI_PASSWORD` | 啟用 AI 密碼保護（默認：`false`）。 | 否 |
| `VITE_ENABLE_HASH_PASSWORD` | 啟用密碼的 SHA-256 哈希校驗（默認：`false`）。如果您的密碼文件中存儲的是哈希值，請設為 `true`。 | 否 |

*注意：如果未提供 `VITE_OPENAI_BASE_URL` 或 `VITE_OPENAI_MODEL`，它們將分別默認為 OpenAI 的官方 API 和 `gpt-5`。*

## AI 鎖（密碼保護）

您可以為筆記本的 AI 功能設置密碼保護。如果您想公開分享筆記，但希望限制 AI 使用（因為會消耗您的 API 配額）僅供自己使用，這非常有用。

1.  **啟用密碼保護**：設置環境變量 `VITE_ENABLE_AI_PASSWORD=true`。
2.  **選擇校驗模式**：
    *   **哈希模式（推薦）**：設置 `VITE_ENABLE_HASH_PASSWORD=true`。系統將驗證密碼文件中的內容是否為 SHA-256 哈希值。
    *   **明文模式**：設置 `VITE_ENABLE_HASH_PASSWORD=false`（默認）。系統將直接比對明文密碼。
3.  在您的 GitHub 筆記倉庫的**根目錄**或 **`public/` 文件夾**中創建一個名為 `password.fianotes` 的文件。
4.  根據步驟 2 的選擇，在此文件中寫入內容：
    *   如果使用**哈希模式**，寫入密碼的 SHA-256 哈希值。您可以使用[在線工具](https://sha256.fiacloud.top)或命令行生成（例如 `echo -n "yourpassword" | sha256sum`）。
    *   如果使用**明文模式**，直接寫入密碼。
5.  提交該文件。

當 `VITE_ENABLE_AI_PASSWORD` 為 true 且密碼文件存在時，AI 側邊欄將需要密碼。如果 `VITE_ENABLE_AI_PASSWORD` 為 false，將忽略密碼文件。

**關於文件位置的說明：**
- **根目錄**：設置最簡單。
- **`public/` 文件夾**：如果您希望保持根目錄整潔，或者您正在部署筆記站點本身並希望靜態提供密碼文件，則可以使用此位置。

> **優先級說明**：如果 GitHub 筆記倉庫的根目錄和 `public/` 文件夾下都存在 `password.fianotes` 文件，將優先使用 **GitHub 筆記倉庫根目錄** 下的密碼文件。

## 本地開發

1. **克隆倉庫**
   ```bash
   git clone https://github.com/Glassous/fianotesweb.git
   cd fianotesweb
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **配置環境**
   將 `.env.example` 複製為 `.env.local` 並填入您的信息：
   ```bash
   cp .env.example .env.local
   ```
   編輯 `.env.local` 並添加您的 `NOTES_REPO_PATH`、`NOTES_PAT` 以及可選的 OpenAI 配置。

4. **啟動開發服務器**
   ```bash
   npm run dev
   ```
   打開 http://localhost:5173 查看您的應用。

## 部署

由於 Fianotes Web 通過 GitHub API 實時獲取您的筆記，因此在更新筆記時無需重新構建應用程序。

### 本地部署

要在本地運行生產就緒版本：

1.  **構建應用程序**：
    ```bash
    npm run build
    ```
2.  **本地預覽**：
    ```bash
    npm run preview
    ```
    或者使用任何靜態文件服務器（例如 `serve`、`nginx`）提供 `dist` 文件夾服務。

### GitHub Pages

要部署到 GitHub Pages，您可以使用 GitHub Actions。

1. 轉到 GitHub 上的倉庫頁面。
2. 導航至 **Settings** > **Secrets and variables** > **Actions**。
3. 添加以下倉庫密鑰（Repository secrets）：
   - `NOTES_REPO_PATH`
   - `NOTES_PAT`
   - `VITE_OPENAI_API_KEY`（可選）
   - `VITE_OPENAI_BASE_URL`（可選）
   - `VITE_OPENAI_MODEL`（可選）
4. 創建一個名為 `.github/workflows/deploy.yml` 的文件，內容如下：

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

5. 轉到 **Settings** > **Pages**，確保 "Build and deployment"（構建和部署）源設置為 **GitHub Actions**。

### Cloudflare Pages

1. 登錄 Cloudflare 控制台並轉到 **Workers & Pages**。
2. 點擊 **Create Application** > **Pages** > **Connect to Git**。
3. 選擇您的倉庫。
4. 配置構建設置：
   - **Framework preset**（框架預設）：Vite
   - **Build command**（構建命令）：`npm run build`
   - **Build output directory**（構建輸出目錄）：`dist`
5. 在 **Environment variables**（環境變量）下，添加：
   - `NOTES_REPO_PATH`
   - `NOTES_PAT`
   - `VITE_OPENAI_API_KEY`
   - `VITE_OPENAI_BASE_URL`（可選）
   - `VITE_OPENAI_MODEL`（可選）
6. 點擊 **Save and Deploy**。

### Vercel

1. 登錄 Vercel 並點擊 **Add New** > **Project**。
2. 導入您的倉庫。
3. 在 **Configure Project**（配置項目）步驟中：
   - **Framework Preset**（框架預設）：Vite
   - **Root Directory**（根目錄）：`./`
   - **Build Command**（構建命令）：`npm run build`
   - **Output Directory**（輸出目錄）：`dist`
4. 展開 **Environment Variables**（環境變量）並添加：
   - `NOTES_REPO_PATH`
   - `NOTES_PAT`
   - `VITE_OPENAI_API_KEY`
   - `VITE_OPENAI_BASE_URL`（可選）
   - `VITE_OPENAI_MODEL`（可選）
5. 點擊 **Deploy**。

## 許可證

本項目採用 Apache License 2.0 許可證。詳情請參閱 [LICENSE](./LICENSE) 文件。
