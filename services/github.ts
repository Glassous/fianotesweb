
import i18n from "../i18n";

const REPO_PATH = process.env.NOTES_REPO_PATH;
const TOKEN = process.env.NOTES_PAT;
const ENABLE_AI_PASSWORD = process.env.VITE_ENABLE_AI_PASSWORD === 'true';
const ENABLE_HASH_PASSWORD = process.env.VITE_ENABLE_HASH_PASSWORD === 'true';

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
  if (!REPO_PATH) {
    return [
      {
        path: "Guide.md",
        mode: "100644",
        type: "blob",
        sha: "local-readme",
        url: "/README_en-US.md",
      },
      {
        path: "指南.md",
        mode: "100644",
        type: "blob",
        sha: "local-readme-cn",
        url: "/README_zh-CN.md",
      },
      {
        path: "指南(繁體).md",
        mode: "100644",
        type: "blob",
        sha: "local-readme-tw",
        url: "/README_zh-TW.md",
      },
      {
        path: "ガイド.md",
        mode: "100644",
        type: "blob",
        sha: "local-readme-jp",
        url: "/README_ja-JP.md",
      },
    ];
  }
  
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
    ".bat", ".cmd", ".ps1", ".vue", ".pdf",
    ".typ"
  ];
  
  return treeData.tree.filter((item: GitHubTreeItem) => 
    item.type === "blob" && allowedExtensions.some(ext => item.path.endsWith(ext))
  );
};

export const fetchBlobContent = async (url: string): Promise<Blob> => {
  if (url.startsWith("/")) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch local content");
    return await res.blob();
  }

  const headers: HeadersInit = {
    Accept: "application/vnd.github.raw", // Request raw content
  };
  
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(i18n.t("errors.github.fetchContentFailed"));
  return await res.blob();
};

export const fetchNoteContent = async (url: string): Promise<string> => {
  if (url.startsWith("/")) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch local content");
    return await res.text();
  }

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

export const fetchBlobContentAsBase64 = async (url: string): Promise<string> => {
    const blob = await fetchBlobContent(url);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to convert blob to base64'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const checkPasswordProtection = async (): Promise<boolean> => {
  if (!REPO_PATH || !ENABLE_AI_PASSWORD) return false;
  
  const checkFile = async (path: string) => {
      try {
        const url = `https://api.github.com/repos/${REPO_PATH}/contents/${path}`;
        const headers: HeadersInit = { Accept: "application/vnd.github+json" };
        if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
        const res = await fetch(url, { method: "HEAD", headers });
        return res.ok;
      } catch (e) {
        return false;
      }
  };

  if (await checkFile('password.fianotes')) return true;
  if (await checkFile('public/password.fianotes')) return true;
  
  return false;
};

export const verifyPassword = async (inputPassword: string): Promise<boolean> => {
  if (!REPO_PATH) return true;
  
  const getPasswordContent = async (path: string): Promise<string | null> => {
      try {
        const url = `https://api.github.com/repos/${REPO_PATH}/contents/${path}`;
        const headers: HeadersInit = { Accept: "application/vnd.github.raw" };
        if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
        
        const res = await fetch(url, { headers });
        if (!res.ok) return null;
        return await res.text();
      } catch (e) {
        return null;
      }
  };

  let truePassword = await getPasswordContent('password.fianotes');
  if (truePassword === null) {
      truePassword = await getPasswordContent('public/password.fianotes');
  }

  if (truePassword === null) return false; 
  
  const storedValue = truePassword.trim();
  
  if (ENABLE_HASH_PASSWORD) {
    // Hash the input password using SHA-256
    const sha256 = async (message: string) => {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const inputHash = await sha256(inputPassword);
    return storedValue === inputHash;
  }
  
  // Plain text check
  return storedValue === inputPassword.trim();
};
