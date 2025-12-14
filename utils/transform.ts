import { RawNoteFile, FileSystemNode, FolderItem, NoteItem } from "../types";

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
        const name = part.replace(/\.md$/, "");
        const noteNode: NoteItem = {
          id: currentPath,
          path: currentPath,
          name: file.metadata?.title || name, // Use Frontmatter title if available
          type: "file",
          content: file.content,
          metadata: file.metadata,
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

  // Sort: Folders first, then Files. Alphabetical within groups.
  const sortNodes = (nodes: (NoteItem | FolderItem)[]) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === "folder" ? -1 : 1;
    });
    nodes.forEach((node) => {
      if (node.type === "folder") {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(root.children);
  return root;
};
