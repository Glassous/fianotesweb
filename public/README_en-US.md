# Fianotes Web

[English](./README_en-US.md) | [简体中文](./README_zh-CN.md) | [繁體中文](./README_zh-TW.md) | [日本語](./README_ja-JP.md)

Fianotes Web is a self-hosted, web-based note-taking platform designed to render your Markdown notes with a beautiful interface. It features AI-powered assistance (Copilot), syntax highlighting, and seamless integration with GitHub for real-time note storage and retrieval.

## Features

- **Real-time GitHub Integration**: Directly fetches and renders notes from a private or public GitHub repository using the GitHub API. No build steps required for content updates.
- **Markdown Rendering**: Full support for GFM (GitHub Flavored Markdown), math equations (KaTeX), and syntax highlighting.
- **AI Copilot**: Integrated AI assistant powered by OpenAI (configurable) to help you summarize, explain, or expand on your notes.
- **Responsive Design**: optimized for both desktop and mobile viewing.
- **Fast & Modern**: Built with React, Vite, and TypeScript.

## Prerequisites: GitHub Token

To allow the application to access your private notes repository, you need to generate a GitHub Personal Access Token (PAT). This token acts as a password for the application to "read" your notes.

1.  Go to **GitHub Settings** > **Developer settings** > **Personal access tokens**.
2.  Select **Fine-grained tokens** (Recommended) or **Tokens (classic)**.
    *   **Fine-grained tokens (More Secure)**:
        *   Click **Generate new token**.
        *   **Repository access**: Select "Only select repositories" and choose your notes repository.
        *   **Permissions**: Select **Contents** and set it to **Read-only**.
        *   **Metadata**: This is usually mandatory and set to **Read-only** automatically.
    *   **Tokens (classic)**:
        *   Click **Generate new token (classic)**.
        *   **Scopes**: If your notes repository is private, you must check the `repo` scope (Full control of private repositories). There is no "read-only" scope for private repos in classic tokens, so treat this token carefully.
3.  **Copy the generated token**. You will need this for the `NOTES_PAT` configuration variable.

## Configuration

The application is configured using environment variables. You can set these in a `.env` file for local development or in your deployment platform's dashboard.

| Variable | Description | Required |
|----------|-------------|----------|
| `NOTES_REPO_PATH` | The GitHub repository path containing your notes (e.g., `username/my-notes`). | Yes |
| `NOTES_PAT` | A GitHub Personal Access Token with repo scope to access the notes repository. | Yes |
| `VITE_OPENAI_BASE_URL` | Base URL for the OpenAI API (default: `https://api.openai.com/v1`). | No |
| `VITE_OPENAI_API_KEY` | Your OpenAI API Key for the Copilot feature. | No |
| `VITE_OPENAI_MODEL` | The AI model to use (default: `gpt-5`). | No |

*Note: If `VITE_OPENAI_BASE_URL` or `VITE_OPENAI_MODEL` are not provided, they will default to OpenAI's official API and `gpt-5` respectively.*

## AI Lock (Password Protection)

You can password-protect the AI features of your notebook. This is useful if you want to share your notes publicly but restrict AI usage (which consumes your API quota) to yourself.

1.  **Enable Password Protection**: Set the environment variable `VITE_ENABLE_AI_PASSWORD=true`.
2.  **Choose Verification Mode**:
    *   **Hash Mode (Recommended)**: Set `VITE_ENABLE_HASH_PASSWORD=true`. The system will expect a SHA-256 hash in your password file.
    *   **Plain Text Mode**: Set `VITE_ENABLE_HASH_PASSWORD=false` (default). The system will expect a plain text password.
3.  Create a file named `password.fianotes` in the root of your GitHub notes repository **OR** in the `public/` folder of your repository.
4.  Write your password in this file based on your choice in step 2:
    *   If using **Hash Mode**, write the SHA-256 hash. You can generate it using [online tools](https://sha256.fiacloud.top) or command line (e.g., `echo -n "yourpassword" | sha256sum`).
    *   If using **Plain Text Mode**, write the password directly.
5.  Commit the file.

When `VITE_ENABLE_AI_PASSWORD` is true and the password file exists, the AI sidebar will require a password. If `VITE_ENABLE_AI_PASSWORD` is false, the password file is ignored.

**Note on File Location:**
- **Root Directory in GitHub Notes Repository**: Easiest to set up.
- **`public/` Folder**: Useful if you want to keep your root directory in GitHub notes repository clean or if you are deploying the notes site itself and want to serve the password file statically.

> **Priority**: If `password.fianotes` exists in both the GitHub repository root and the `public/` folder, the one in the GitHub repository root will take precedence.

## Custom Root Directory

You can customize the root directory of your notes by creating a file named `name.fianotes` in the root of your repository.

1.  Create a file named `name.fianotes` in the root directory.
2.  Inside the file, write the name of the folder you want to use as the root (e.g., `NotesInFia`).
3.  Ensure a folder with that name exists in the root directory.

If both the `name.fianotes` file and the specified folder exist, the application will treat that folder as the root directory for your notes.

## Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Glassous/fianotesweb.git
   cd fianotesweb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Copy `.env.example` to `.env.local` and fill in your details:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your `NOTES_REPO_PATH`, `NOTES_PAT`, and optional OpenAI configurations.

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 to view your app.

## Deployment

Since Fianotes Web fetches your notes in real-time via the GitHub API, you don't need to rebuild the application when you update your notes.

### Local Deployment

To run a production-ready version locally:

1.  **Build the application**:
    ```bash
    npm run build
    ```
2.  **Preview locally**:
    ```bash
    npm run preview
    ```
    Or serve the `dist` folder using any static file server (e.g., `serve`, `nginx`).

### GitHub Pages

To deploy to GitHub Pages, you can use GitHub Actions.

1. Go to your repository on GitHub.
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Add the following repository secrets:
   - `NOTES_REPO_PATH`
   - `NOTES_PAT`
   - `VITE_OPENAI_API_KEY` (Optional)
   - `VITE_OPENAI_BASE_URL` (Optional)
   - `VITE_OPENAI_MODEL` (Optional)
4. Create a file named `.github/workflows/deploy.yml` with the following content:

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

5. Go to **Settings** > **Pages** and ensure "Build and deployment" source is set to **GitHub Actions**.

### Cloudflare Pages

1. Log in to the Cloudflare Dashboard and go to **Workers & Pages**.
2. Click **Create Application** > **Pages** > **Connect to Git**.
3. Select your repository.
4. Configure the build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Under **Environment variables**, add:
   - `NOTES_REPO_PATH`
   - `NOTES_PAT`
   - `VITE_OPENAI_API_KEY`
   - `VITE_OPENAI_BASE_URL` (Optional)
   - `VITE_OPENAI_MODEL` (Optional)
6. Click **Save and Deploy**.

### Vercel

1. Log in to Vercel and click **Add New** > **Project**.
2. Import your repository.
3. In the **Configure Project** step:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - `NOTES_REPO_PATH`
   - `NOTES_PAT`
   - `VITE_OPENAI_API_KEY`
   - `VITE_OPENAI_BASE_URL` (Optional)
   - `VITE_OPENAI_MODEL` (Optional)
5. Click **Deploy**.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](./LICENSE) file for details.
