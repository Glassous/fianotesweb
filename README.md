# Fianotes Web

[中文版](./README_zh-CN.md)

Fianotes Web is a self-hosted, web-based note-taking platform designed to render your Markdown notes with a beautiful interface. It features AI-powered assistance (Copilot), syntax highlighting, and seamless integration with GitHub for note storage.

## Features

- **Markdown Rendering**: Full support for GFM (GitHub Flavored Markdown), math equations (KaTeX), and syntax highlighting.
- **AI Copilot**: Integrated AI assistant powered by OpenAI (configurable) to help you summarize, explain, or expand on your notes.
- **GitHub Integration**: Automatically fetches and renders notes from a private or public GitHub repository.
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
| `VITE_OPENAI_MODEL` | The AI model to use (e.g., `gpt-5.2`). | No |

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
   Edit `.env.local` and add your `NOTES_REPO_PATH` and `NOTES_PAT`.

4. **Fetch Notes**
   Run the scan script to clone your notes repository into the local `content` directory and generate the manifest:
   ```bash
   npm run scan
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 to view your app.

## Deployment

Since Fianotes Web is a static web application that builds its content at build time, you can deploy it to any static hosting provider. The build process requires fetching your notes, so environment variables must be available during the build.

### GitHub Pages

To deploy to GitHub Pages, you can use GitHub Actions.

1. Go to your repository on GitHub.
2. Navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Add the following repository secrets:
   - `NOTES_REPO_PATH`
   - `NOTES_PAT`
   - `VITE_OPENAI_API_KEY` (Optional, if using AI features)
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

      - name: Scan and Build
        env:
          NOTES_REPO_PATH: ${{ secrets.NOTES_REPO_PATH }}
          NOTES_PAT: ${{ secrets.NOTES_PAT }}
          VITE_OPENAI_API_KEY: ${{ secrets.VITE_OPENAI_API_KEY }}
        run: |
          npm run scan
          npm run build

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
   - **Build command**: `npm run scan && npm run build`
   - **Build output directory**: `dist`
5. Under **Environment variables**, add:
   - `NOTES_REPO_PATH`
   - `NOTES_PAT`
   - `VITE_OPENAI_API_KEY`
6. Click **Save and Deploy**.

### Vercel

1. Log in to Vercel and click **Add New** > **Project**.
2. Import your repository.
3. In the **Configure Project** step:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: Turn on the override and set it to: `npm run scan && npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - `NOTES_REPO_PATH`
   - `NOTES_PAT`
   - `VITE_OPENAI_API_KEY`
5. Click **Deploy**.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](./LICENSE) file for details.
