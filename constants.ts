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
  {
    filePath: "Demo/Page.html",
    content:
      "<!DOCTYPE html>\n<html>\n<head>\n<style>\nbody { font-family: sans-serif; color: #333; padding: 20px; }\nh1 { color: #007bff; }\n</style>\n</head>\n<body>\n<h1>Hello from HTML</h1>\n<p>This is a <strong>preview</strong> of an HTML file.</p>\n<button onclick=\"alert('It works!')\">Click Me</button>\n</body>\n</html>",
    metadata: { title: "HTML Demo" },
  },
  {
    filePath: "Demo/Code.cpp",
    content:
      "#include <iostream>\n\nint main() {\n    std::cout << \"Hello, World!\" << std::endl;\n    return 0;\n}",
    metadata: { title: "CPP Demo" },
  },
];
