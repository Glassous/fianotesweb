# Fianotes Web

[English Version](./README.md)

Fianotes Web 是一个自托管的 Web 笔记平台，旨在以精美的界面展示您的 Markdown 笔记。它具有 AI 辅助（Copilot）、语法高亮以及与 GitHub 无缝集成进行实时笔记存储和检索的功能。

## 功能特性

- **实时 GitHub 集成**：直接使用 GitHub API 从私有或公共 GitHub 仓库获取并渲染笔记。内容更新无需构建步骤。
- **Markdown 渲染**：全面支持 GFM（GitHub Flavored Markdown）、数学公式（KaTeX）和代码语法高亮。
- **AI Copilot**：集成由 OpenAI 驱动的 AI 助手（可配置），帮助您总结、解释或扩展笔记内容。
- **响应式设计**：针对桌面和移动设备进行了优化。
- **快速且现代**：基于 React、Vite 和 TypeScript 构建。

## 前置准备：GitHub Token

为了让应用程序能够访问您的私有笔记仓库，您需要生成一个 GitHub 个人访问令牌（Personal Access Token, PAT）。该令牌充当应用程序“读取”您笔记的密码。

1.  进入 **GitHub Settings**（设置） > **Developer settings**（开发者设置） > **Personal access tokens**（个人访问令牌）。
2.  选择 **Fine-grained tokens**（细粒度令牌，推荐）或 **Tokens (classic)**（经典令牌）。
    *   **Fine-grained tokens (更安全)**:
        *   点击 **Generate new token**。
        *   **Repository access**（仓库访问）：选择 "Only select repositories"（仅选择特定仓库）并选择您的笔记仓库。
        *   **Permissions**（权限）：找到 **Contents**（内容）并将其设置为 **Read-only**（只读）。
        *   **Metadata**（元数据）：这通常是强制性的，会自动设置为 **Read-only**。
    *   **Tokens (classic)**:
        *   点击 **Generate new token (classic)**。
        *   **Scopes**（范围）：如果您的笔记仓库是私有的，您必须勾选 `repo` 范围（对私有仓库的完全控制）。经典令牌没有针对私有仓库的“只读”范围，因此请妥善保管此令牌。
3.  **复制生成的令牌**。您将在配置 `NOTES_PAT` 变量时使用它。

## 配置

应用程序使用环境变量进行配置。您可以在本地开发的 `.env` 文件中设置这些变量，或者在部署平台的仪表板中进行设置。

| 变量名 | 描述 | 是否必须 |
|----------|-------------|----------|
| `NOTES_REPO_PATH` | 包含笔记的 GitHub 仓库路径（例如：`username/my-notes`）。 | 是 |
| `NOTES_PAT` | 用于访问笔记仓库的 GitHub 个人访问令牌（Personal Access Token），需要 repo 权限。 | 是 |
| `VITE_OPENAI_BASE_URL` | OpenAI API 的基础 URL（默认：`https://api.openai.com/v1`）。 | 否 |
| `VITE_OPENAI_API_KEY` | 用于 Copilot 功能的 OpenAI API 密钥。 | 否 |
| `VITE_OPENAI_MODEL` | 使用的 AI 模型（默认：`gpt-5`）。 | 否 |

*注意：如果未提供 `VITE_OPENAI_BASE_URL` 或 `VITE_OPENAI_MODEL`，它们将分别默认为 OpenAI 的官方 API 和 `gpt-5`。*

## AI 锁（密码保护）

您可以为笔记本的 AI 功能设置密码保护。如果您想公开分享笔记，但希望限制 AI 使用（因为会消耗您的 API 配额）仅供自己使用，这非常有用。

1.  在您的 GitHub 笔记仓库的**根目录**或 **`public/` 文件夹**中创建一个名为 `password.fianotes` 的文件。
2.  在此文件中写入您的密码。
    *   **选项 1（推荐）：** 写入密码的 SHA-256 哈希值。您可以使用在线工具或命令行生成（例如 `echo -n "yourpassword" | sha256sum`）。
    *   **选项 2：** 以纯文本形式写入密码。
3.  提交该文件。

当任一位置存在此文件时，AI 侧边栏将需要密码才能运行。如果文件不存在，AI 功能将对所有人开放。

**关于文件位置的说明：**
- **根目录**：设置最简单。
- **`public/` 文件夹**：如果您希望保持根目录整洁，或者您正在部署笔记站点本身并希望静态提供密码文件，则可以使用此位置。

> **优先级说明**：如果 GitHub 笔记仓库的根目录和 `public/` 文件夹下都存在 `password.fianotes` 文件，将优先使用 **GitHub 笔记仓库根目录** 下的密码文件。

## 本地开发

1. **克隆仓库**
   ```bash
   git clone https://github.com/Glassous/fianotesweb.git
   cd fianotesweb
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境**
   将 `.env.example` 复制为 `.env.local` 并填入您的信息：
   ```bash
   cp .env.example .env.local
   ```
   编辑 `.env.local` 并添加您的 `NOTES_REPO_PATH`、`NOTES_PAT` 以及可选的 OpenAI 配置。

4. **启动开发服务器**
   ```bash
   npm run dev
   ```
   打开 http://localhost:5173 查看您的应用。

## 部署

由于 Fianotes Web 通过 GitHub API 实时获取您的笔记，因此在更新笔记时无需重新构建应用程序。

### 本地部署

要在本地运行生产就绪版本：

1.  **构建应用程序**：
    ```bash
    npm run build
    ```
2.  **本地预览**：
    ```bash
    npm run preview
    ```
    或者使用任何静态文件服务器（例如 `serve`、`nginx`）提供 `dist` 文件夹服务。

### GitHub Pages

要部署到 GitHub Pages，您可以使用 GitHub Actions。

1. 转到 GitHub 上的仓库页面。
2. 导航至 **Settings** > **Secrets and variables** > **Actions**。
3. 添加以下仓库密钥（Repository secrets）：
   - `NOTES_REPO_PATH`
   - `NOTES_PAT`
   - `VITE_OPENAI_API_KEY`（可选）
   - `VITE_OPENAI_BASE_URL`（可选）
   - `VITE_OPENAI_MODEL`（可选）
4. 创建一个名为 `.github/workflows/deploy.yml` 的文件，内容如下：

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

5. 转到 **Settings** > **Pages**，确保 "Build and deployment"（构建和部署）源设置为 **GitHub Actions**。

### Cloudflare Pages

1. 登录 Cloudflare 控制台并转到 **Workers & Pages**。
2. 点击 **Create Application** > **Pages** > **Connect to Git**。
3. 选择您的仓库。
4. 配置构建设置：
   - **Framework preset**（框架预设）：Vite
   - **Build command**（构建命令）：`npm run build`
   - **Build output directory**（构建输出目录）：`dist`
5. 在 **Environment variables**（环境变量）下，添加：
   - `NOTES_REPO_PATH`
   - `NOTES_PAT`
   - `VITE_OPENAI_API_KEY`
   - `VITE_OPENAI_BASE_URL`（可选）
   - `VITE_OPENAI_MODEL`（可选）
6. 点击 **Save and Deploy**。

### Vercel

1. 登录 Vercel 并点击 **Add New** > **Project**。
2. 导入您的仓库。
3. 在 **Configure Project**（配置项目）步骤中：
   - **Framework Preset**（框架预设）：Vite
   - **Root Directory**（根目录）：`./`
   - **Build Command**（构建命令）：`npm run build`
   - **Output Directory**（输出目录）：`dist`
4. 展开 **Environment Variables**（环境变量）并添加：
   - `NOTES_REPO_PATH`
   - `NOTES_PAT`
   - `VITE_OPENAI_API_KEY`
   - `VITE_OPENAI_BASE_URL`（可选）
   - `VITE_OPENAI_MODEL`（可选）
5. 点击 **Deploy**。

## 许可证

本项目采用 Apache License 2.0 许可证。详情请参阅 [LICENSE](./LICENSE) 文件。
