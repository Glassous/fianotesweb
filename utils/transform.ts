import { RawNoteFile, FileSystemNode, FolderItem, NoteItem, OutlineItem } from "../types";

export const extractHeadings = (content: string): OutlineItem[] => {
  const lines = content.split("\n");
  const root: OutlineItem[] = [];
  const stack: OutlineItem[] = [];
  
  // Simple slugify function
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\u4e00-\u9fa5-]/g, "") // Allow Chinese characters
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };
  
  // Keep track of slugs to handle duplicates (though renderer might struggle with duplicates without context)
  // For now, we'll just use the simple slug and hope for uniqueness or accept first-match behavior
  // To make it robust with the renderer, the renderer also needs to know about duplicates. 
  // Since we can't easily share state with the renderer's internal loop, we will stick to simple slugs.

  lines.forEach((line, index) => {
    // Match Markdown headings (e.g., # Heading)
    // We ignore headings inside code blocks for simplicity in this regex approach,
    // though a full parser would be more robust.
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2];
      const slug = slugify(text);
      
      const item: OutlineItem = {
        id: slug, // Use slug as ID for linking
        text,
        level,
        line: index,
        children: [],
      };

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(item);
      } else {
        stack[stack.length - 1].children.push(item);
      }
      stack.push(item);
    }
  });

  return root;
};

export const buildFileTree = (rawFiles: RawNoteFile[]): FolderItem => {
  const root: FolderItem = {
    id: "root",
    path: "",
    name: "Home",
    type: "folder",
    children: [],
  };

  rawFiles.forEach((file) => {
    // Normalize path separators
    const parts = file.filePath.split("/");
    let currentLevel = root.children;
    let currentPath = "";

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (isFile) {
        // Remove .md extension for display if desired, or keep it
        const name = part;
        const noteNode: NoteItem = {
          id: currentPath,
          path: currentPath,
          name: name, // Use filename directly to show extension
          type: "file",
          content: file.content,
          metadata: file.metadata,
          sha: file.sha,
        };
        currentLevel.push(noteNode);
      } else {
        // Folder
        let folderNode = currentLevel.find(
          (node) => node.type === "folder" && node.name === part,
        ) as FolderItem;

        if (!folderNode) {
          folderNode = {
            id: currentPath,
            path: currentPath,
            name: part,
            type: "folder",
            children: [],
          };
          currentLevel.push(folderNode);
        }

        currentLevel = folderNode.children;
      }
    });
  });

  return root;
};

// Helper to determine language from extension
export const getLanguageFromExtension = (filePath: string): string | null => {
  const ext = filePath.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "c": return "c";
    case "cpp": case "h": case "hpp": return "cpp";
    case "java": return "java";
    case "py": return "python";
    case "js": case "jsx": return "javascript";
    case "ts": case "tsx": return "typescript";
    case "sql": return "sql";
    case "css": return "css";
    case "json": return "json";
    case "go": return "go";
    case "rs": return "rust";
    case "sh": return "bash";
    case "yaml": case "yml": return "yaml";
    case "xml": return "xml";
    case "kt": case "kts": return "kotlin";
    case "php": return "php";
    case "rb": return "ruby";
    case "cs": return "csharp";
    case "swift": return "swift";
    case "lua": return "lua";
    case "r": return "r";
    case "dart": return "dart";
    case "bat": case "cmd": return "batch";
    case "ps1": return "powershell";
    case "vue": return "xml";
    case "typ": return "typst";
    case "tex": return "latex";
    default: return null;
  }
};
