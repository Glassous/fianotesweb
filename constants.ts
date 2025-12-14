import { RawNoteFile } from "./types";

// In a real build, this data is replaced by the output of scripts/scan-notes.js
// This MOCK data ensures the project is runnable immediately after scaffolding.
export const MOCK_NOTES: RawNoteFile[] = [
  {
    filePath: "Welcome.md",
    content:
      "# Welcome to FiaNotes\n\nThis is a **read-only** static site generated from your private Markdown notes.\n\n## How it works\n1. You push markdown to a private repo.\n2. GitHub Actions runs.\n3. A static site is built and deployed.\n\nEverything is secure.",
    metadata: { title: "Welcome", date: "2023-10-27" },
  },
  {
    filePath: "Tech/React/Hooks.md",
    content:
      "# React Hooks\n\nDon't forget the dependency array in `useEffect`!\n\n```javascript\nuseEffect(() => {\n  console.log('Mounted');\n}, []);\n```",
    metadata: { title: "React Hooks Cheatsheet", tags: ["react", "frontend"] },
  },
  {
    filePath: "Tech/Architecture/StaticSites.md",
    content:
      "# Static Site Benefits\n\n- **Security**: No database to hack.\n- **Speed**: Pre-rendered HTML/JSON.\n- **Cost**: Free hosting on GitHub Pages.",
    metadata: { title: "Why Static?", tags: ["arch"] },
  },
  {
    filePath: "Personal/Ideas.md",
    content:
      "# App Ideas\n\n- A specialized note taking app for architects.\n- A static site generator for notes.",
    metadata: { title: "Ideas" },
  },
];
