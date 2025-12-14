
const REPO_PATH = process.env.NOTES_REPO_PATH;
const TOKEN = process.env.NOTES_PAT;

export const isGitHubConfigured = () => {
  return !!REPO_PATH;
};

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

export const fetchNotesTree = async (): Promise<GitHubTreeItem[]> => {
  if (!REPO_PATH) throw new Error("GitHub Repository Path not configured");
  
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
  };
  
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }

  // First get the default branch
  const repoRes = await fetch(`https://api.github.com/repos/${REPO_PATH}`, { headers });
  if (!repoRes.ok) {
      const errorText = await repoRes.text();
      throw new Error(`Failed to fetch repo info: ${repoRes.status} ${errorText}`);
  }
  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch;

  // Fetch the tree recursively
  const treeRes = await fetch(
    `https://api.github.com/repos/${REPO_PATH}/git/trees/${defaultBranch}?recursive=1`,
    { headers }
  );
  
  if (!treeRes.ok) {
      const errorText = await treeRes.text();
      throw new Error(`Failed to fetch file tree: ${treeRes.status} ${errorText}`);
  }
  
  const treeData = await treeRes.json();
  // Filter only markdown files
  return treeData.tree.filter((item: GitHubTreeItem) => 
    item.type === "blob" && item.path.endsWith(".md")
  );
};

export const fetchNoteContent = async (url: string): Promise<string> => {
    const headers: HeadersInit = {
    Accept: "application/vnd.github.raw", // Request raw content
  };
  
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("Failed to fetch content");
  return await res.text();
};
