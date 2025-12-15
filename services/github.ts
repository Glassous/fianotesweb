
import i18n from "../i18n";

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
  if (!REPO_PATH) throw new Error(i18n.t("errors.github.repoNotConfigured"));
  
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
      throw new Error(i18n.t("errors.github.fetchRepoInfoFailed", { status: repoRes.status, text: errorText }));
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
      throw new Error(i18n.t("errors.github.fetchTreeFailed", { status: treeRes.status, text: errorText }));
  }
  
  const treeData = await treeRes.json();
  // Filter markdown, html and code files
  const allowedExtensions = [
    ".md", ".html", 
    ".c", ".cpp", ".h", ".hpp", ".java", 
    ".py", ".js", ".jsx", ".ts", ".tsx", 
    ".sql", ".css", ".json", ".go", ".rs", 
    ".sh", ".yaml", ".yml", ".xml",
    ".kt", ".kts", ".php", ".rb", ".cs",
    ".swift", ".lua", ".r", ".dart",
    ".bat", ".cmd", ".ps1"
  ];
  
  return treeData.tree.filter((item: GitHubTreeItem) => 
    item.type === "blob" && allowedExtensions.some(ext => item.path.endsWith(ext))
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
  if (!res.ok) throw new Error(i18n.t("errors.github.fetchContentFailed"));
  return await res.text();
};
