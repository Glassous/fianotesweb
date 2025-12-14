# FiaNotes

FiaNotes is a secure, read-only personal knowledge base generator. It takes Markdown files from a private GitHub repository and builds a static React website.

## 🏗 Architecture

1.  **Source**: Your notes live in a private GitHub repository.
2.  **Build**: GitHub Actions checks out both this site repository and your private notes repository.
3.  **Process**: A build script (`scripts/scan-notes.js`) reads the notes, converts them to a large JSON object (`src/data/notes-data.json`).
4.  **Bundle**: React bundles this JSON directly into the application.
5.  **Serve**: The output is a pure static site (HTML/JS/CSS) hosted on GitHub Pages. No database, no API keys on the client.

## 🚀 Getting Started

### 1. Prerequisites
- A private GitHub repository containing your Markdown (`.md`) notes.
- A GitHub Personal Access Token (PAT) with `repo` scope to read that private repository.

### 2. Configuration (GitHub Secrets)
In this repository's Settings > Secrets and variables > Actions, add:
- `NOTES_REPO_PATH`: The `username/repo-name` of your private notes.
- `NOTES_PAT`: Your Personal Access Token.

### 3. Local Development
1. Clone this repo.
2. `npm install`
3. `npm run dev`
   *Note: Without the private repo present in `content/`, the app uses Mock Data defined in `constants.ts`.*

### 4. Simulating Production Build Locally
1. Create a folder named `content` in the root.
2. Copy some markdown files into it.
3. Run `node scripts/scan-notes.js`.
4. Run `npm run dev` to see your actual notes.

## 📂 Project Structure

```
/
├── content/              (Ignored by git; where private notes are cloned during build)
├── scripts/
│   └── scan-notes.js     (Generates JSON from markdown files)
├── src/
│   ├── components/       (UI Components: Sidebar, MarkdownRenderer)
│   ├── data/             (Generated JSON lives here)
│   ├── utils/            (Tree transformation logic)
│   ├── App.tsx           (Router & Layout)
│   └── constants.ts      (Mock data for dev)
└── .github/workflows/    (CI/CD Pipeline)
```
