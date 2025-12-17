import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  HashRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sidebar } from "./components/Sidebar";
import { CopilotSidebar } from "./components/CopilotSidebar";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { CodeViewer } from "./components/CodeViewer";
import { JSXRenderer } from "./components/JSXRenderer";
import { VueRenderer } from "./components/VueRenderer";
import { LoadingAnimation } from "./components/LoadingAnimation";
import { buildFileTree, extractHeadings } from "./utils/transform";
import { parseFrontmatter } from "./utils/frontmatter";
import { MOCK_NOTES } from "./constants";
import { RawNoteFile, NoteItem, OutlineItem } from "./types";
import { fetchNotesTree, fetchNoteContent, isGitHubConfigured } from "./services/github";

import { getFileIcon } from "./components/FileIcons";

// --- Icons ---
const MenuIcon = () => (
  <svg
    className="w-6 h-6 text-zinc-600 dark:text-zinc-300"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || "w-6 h-6 text-zinc-600 dark:text-zinc-300"}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || "w-5 h-5"}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const SunIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const MoonIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const SystemIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const MoreVerticalIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
    />
  </svg>
);

const GithubIcon = () => (
  <svg
    className="w-5 h-5"
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      clipRule="evenodd"
    />
  </svg>
);

const RobotIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const SparklesIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);

const LanguageIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

type ThemeMode = "system" | "light" | "dark";

// Helper to determine language from extension
const getLanguageFromExtension = (filePath: string): string | null => {
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
    default: return null;
  }
};

interface RecentFile {
  filePath: string;
  title: string;
  timestamp: number;
}

const MainLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const rawPath = params["*"];

  // --- State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isCopilotExpanded, setIsCopilotExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hoverOpen, setHoverOpen] = useState(false); // For edge hover
  const mainContentRef = useRef<HTMLDivElement>(null);

  // --- Language Switcher State ---
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // --- Mobile Menu State ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleDownload = () => {
    if (!currentNote) return;
    if (!currentNote.content) return;
    const blob = new Blob([currentNote.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentNote.filePath.split("/").pop() || "note.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsMobileMenuOpen(false);
  };

  const handleRefreshHtmlPreview = () => {
    if (currentNote?.filePath.endsWith(".html") && viewMode === "preview") {
      const iframe = document.querySelector('iframe[title="Preview"]') as HTMLIFrameElement;
      if (iframe) {
        iframe.srcdoc = currentNote?.content || "";
      }
    } else if (currentNote?.filePath.endsWith(".jsx") && viewMode === "preview") {
      setRefreshKey(prev => prev + 1);
    }
  };


  // --- Resize State (Desktop Only) ---
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const [copilotWidth, setCopilotWidth] = useState(320);
  const isResizingSidebar = useRef(false);
  const isResizingCopilot = useRef(false);
  
  // Refs for Direct DOM Manipulation (Performance)
  const sidebarRef = useRef<HTMLElement>(null);
  const copilotRef = useRef<HTMLElement>(null);
  const currentSidebarWidthRef = useRef(288);
  const currentCopilotWidthRef = useRef(320);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar.current && sidebarRef.current) {
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 600) {
          // Direct DOM update
          sidebarRef.current.style.width = `${newWidth}px`;
          // Disable transition during drag to prevent lag
          sidebarRef.current.style.transition = 'none';
          currentSidebarWidthRef.current = newWidth;
        }
      }
      if (isResizingCopilot.current && copilotRef.current) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 250 && newWidth <= 800) {
           // Direct DOM update
           copilotRef.current.style.width = `${newWidth}px`;
           copilotRef.current.style.marginRight = '0px'; // Ensure it stays docked
           // Disable transition
           copilotRef.current.style.transition = 'none';
           currentCopilotWidthRef.current = newWidth;
        }
      }
    };

    const handleMouseUp = () => {
      if (isResizingSidebar.current) {
        isResizingSidebar.current = false;
        setSidebarWidth(currentSidebarWidthRef.current);
        if (sidebarRef.current) {
            sidebarRef.current.style.transition = ''; // Restore transition
        }
      }
      if (isResizingCopilot.current) {
        isResizingCopilot.current = false;
        setCopilotWidth(currentCopilotWidthRef.current);
        if (copilotRef.current) {
            copilotRef.current.style.transition = ''; // Restore transition
        }
      }
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Data State
  const [notesData, setNotesData] = useState<RawNoteFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Recent Files State
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [copilotContextFiles, setCopilotContextFiles] = useState<RawNoteFile[]>([]);
  
  // Open Files State (Tabs)
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);

  // Outline State
  const [sidebarTab, setSidebarTab] = useState<"files" | "outline">("files");
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // View Mode State (for HTML files)
  const [viewMode, setViewMode] = useState<"preview" | "source">("preview");
  const [refreshKey, setRefreshKey] = useState(0);

  // --- Tab Bar Logic ---
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [tabsContainerWidth, setTabsContainerWidth] = useState(0);
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);
  const overflowMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tabsContainerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setTabsContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(tabsContainerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(event.target as Node)) {
        setIsOverflowMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initial Load
  const loadNotes = async () => {
    if (isGitHubConfigured()) {
      setIsLoading(true);
      try {
        const tree = await fetchNotesTree();
        const rawFiles: RawNoteFile[] = tree.map((item) => ({
          filePath: item.path,
          sha: item.sha,
          blobUrl: item.url,
          content: undefined,
          metadata: undefined,
        }));
        setNotesData(rawFiles);
      } catch (err: any) {
        console.error("Failed to fetch notes tree:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      setNotesData(MOCK_NOTES);
    }
  };

  useEffect(() => {
    loadNotes();
    
    // Load Recent Files
    const stored = localStorage.getItem("recentFiles");
    if (stored) {
      try {
        setRecentFiles(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent files", e);
      }
    }
  }, []);

  // --- Theme State & Logic ---
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem("theme") as ThemeMode) || "system";
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const systemQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (mode: ThemeMode) => {
      const isDark =
        mode === "dark" || (mode === "system" && systemQuery.matches);
      setIsDarkMode(isDark);
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme(themeMode);
    localStorage.setItem("theme", themeMode);

    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (themeMode === "system") {
        if (e.matches) root.classList.add("dark");
        else root.classList.remove("dark");
      }
    };

    systemQuery.addEventListener("change", handleSystemChange);
    return () => systemQuery.removeEventListener("change", handleSystemChange);
  }, [themeMode]);

  const cycleTheme = () => {
    const modes: ThemeMode[] = ["system", "light", "dark"];
    const nextIndex = (modes.indexOf(themeMode) + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  // --- Resize Handler ---
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const fileTree = useMemo(() => buildFileTree(notesData), [notesData]);

  // Fix: Extract actual file path from route parameter
  // The route is usually /note/some/file.md, so rawPath is "note/some/file.md"
  // We need to strip the "note/" prefix to match the ID in sourceData
  const activeFilePath = useMemo(() => {
    // Only use rawPath if we are NOT in the initial load state where we want to clear selection
    // But since the requirement is "don't save state", we can just ignore the URL on mount?
    // Actually, "refresh should not open any file" implies we shouldn't sync URL to state on mount,
    // OR we should clear the URL on mount.
    
    if (!rawPath) return null;
    const decoded = decodeURIComponent(rawPath);
    return decoded.startsWith("note/")
      ? decoded.replace(/^note\//, "")
      : decoded;
  }, [rawPath]);

  // Effect: Add active file to open files list
  useEffect(() => {
    if (activeFilePath && !openFiles.includes(activeFilePath)) {
      setOpenFiles(prev => [...prev, activeFilePath]);
    }
  }, [activeFilePath]);

  // Effect: On Mount, if there is a path, clear it.
  useEffect(() => {
    if (location.pathname !== "/") {
      setOpenFiles([]);
      navigate("/", { replace: true });
    }
  }, []); // Run once on mount

  const currentNote = useMemo(() => {
    if (!activeFilePath) return null;
    return notesData.find((n) => n.filePath === activeFilePath);
  }, [activeFilePath, notesData]);

  // Effect: Update Recent Files
  useEffect(() => {
    if (currentNote) {
      setRecentFiles((prev) => {
        const newItem: RecentFile = {
          filePath: currentNote.filePath,
          title: currentNote.metadata?.title || currentNote.filePath.split("/").pop()?.replace(/\.md$/, "") || t('app.untitled'),
          timestamp: Date.now(),
        };
        // Remove existing entry for same file to avoid duplicates
        const filtered = prev.filter((f) => f.filePath !== currentNote.filePath);
        // Add new item to top
        const newRecent = [newItem, ...filtered].slice(0, 3); // Keep top 3
        localStorage.setItem("recentFiles", JSON.stringify(newRecent));
        return newRecent;
      });
    }
  }, [currentNote]);

  // Effect: Cleanup recent files that no longer exist
  useEffect(() => {
    if (notesData.length > 0 && recentFiles.length > 0) {
      const validRecent = recentFiles.filter(recent => 
        notesData.some(note => note.filePath === recent.filePath)
      );
      
      if (validRecent.length !== recentFiles.length) {
        setRecentFiles(validRecent);
        localStorage.setItem("recentFiles", JSON.stringify(validRecent));
      }
    }
  }, [notesData]); // Run when notesData loads or changes


  // Effect: Update outline when note content changes
  useEffect(() => {
    if (currentNote && currentNote.content && currentNote.filePath.endsWith(".md")) {
      const headings = extractHeadings(currentNote.content);
      setOutlineItems(headings);
      // Auto-switch to outline tab when opening/loading a markdown file
      setSidebarTab("outline");
    } else {
      setOutlineItems([]);
      setActiveHeadingId(null);
      // Switch back to files if no valid markdown file is active
      setSidebarTab("files");
    }
  }, [currentNote]);

  // Effect: Scroll Spy for Outline Highlighting
  useEffect(() => {
    const container = document.getElementById(`scroll-container-${activeFilePath}`);
    if (!container || !outlineItems.length) return;

    // Helper to flatten outline items for easier traversal
    const flattenItems = (items: OutlineItem[]): OutlineItem[] => {
      return items.reduce((acc, item) => {
        acc.push(item);
        if (item.children) {
          acc.push(...flattenItems(item.children));
        }
        return acc;
      }, [] as OutlineItem[]);
    };

    const flatHeadings = flattenItems(outlineItems);

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const offset = 120; // Look a bit down from the top

      let currentActiveId = null;

      for (const item of flatHeadings) {
        const element = document.getElementById(item.id);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        
        // Check if the heading is above or near the top of the container
        if (rect.top <= containerRect.top + offset) {
          currentActiveId = item.id;
        } else {
          // Since headings are ordered, once we find one below, we can stop
          break;
        }
      }

      setActiveHeadingId(currentActiveId);
    };

    // Throttle scroll event
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener("scroll", onScroll);
    // Initial check
    handleScroll();

    return () => container.removeEventListener("scroll", onScroll);
  }, [outlineItems]);

  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id);
    const container = document.getElementById(`scroll-container-${activeFilePath}`);

    if (element && container) {
      // Calculate position relative to the scroll container
      // We use getBoundingClientRect to get precise positions relative to the viewport
      // regardless of nesting, then calculate the difference.
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Current scroll position
      const currentScroll = container.scrollTop;
      
      // Target position: Current Scroll + (Element Top - Container Top) - Offset
      // The offset (e.g. 24px) gives a bit of breathing room at the top
      const targetTop = currentScroll + (elementRect.top - containerRect.top) - 24;

      container.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
    }
  };

  // Lazy Load Content
  useEffect(() => {
    if (!activeFilePath || !notesData.length) return;

    const note = notesData.find((n) => n.filePath === activeFilePath);
    // If we have a note but no content, and it has a blobUrl (implies GitHub mode)
    if (note && !note.content && note.blobUrl && !contentLoading) {
      setContentLoading(true);
      fetchNoteContent(note.blobUrl)
        .then((content) => {
           // Parse Frontmatter
           const { data, content: mdContent } = parseFrontmatter(content);

           setNotesData((prev) =>
            prev.map((n) =>
              n.filePath === activeFilePath
                ? { ...n, content: mdContent, metadata: data }
                : n,
            ),
          );
        })
        .catch((err) => {
          console.error("Failed to load content", err);
        })
        .finally(() => setContentLoading(false));
    }
  }, [activeFilePath, notesData]); // Note: This dependency array is safe because we check !note.content

  // Callback to update note content (caching) from Copilot
  const handleUpdateNoteContent = (filePath: string, content: string) => {
      setNotesData(prev => prev.map(n => 
          n.filePath === filePath ? { ...n, content } : n
      ));
  };

  // Effect: Reset view mode to preview when file changes
  useEffect(() => {
    // Reset view mode to preview when file changes
    setViewMode("preview");
  }, [activeFilePath]);

  // Word count calculation
  const wordCount = useMemo(() => {
    if (!currentNote?.content) return 0;
    return currentNote.content.split(/\s+/).filter(Boolean).length;
  }, [currentNote]);

  const handleSelectNote = (note: NoteItem) => {
    // Navigate using the 'note' prefix to distinguish from other potential routes
    navigate(`/note/${note.path}`);
  };

  const handleCloseTab = (e: React.MouseEvent, filePath: string) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter(f => f !== filePath);
    setOpenFiles(newOpenFiles);
    
    // If we closed the active file, navigate to another one
    if (activeFilePath === filePath) {
        if (newOpenFiles.length > 0) {
            // Navigate to the last opened file
            navigate(`/note/${newOpenFiles[newOpenFiles.length - 1]}`);
        } else {
            navigate('/');
        }
    }
  };

  const handleRemoveRecentFile = (e: React.MouseEvent, filePath: string) => {
    e.stopPropagation();
    setRecentFiles((prev) => {
      const newRecent = prev.filter((f) => f.filePath !== filePath);
      localStorage.setItem("recentFiles", JSON.stringify(newRecent));
      return newRecent;
    });
  };

  const handleAskCopilot = (text: string) => {
    setIsCopilotOpen(true);
    
    // Create a display title from the first few characters
    const cleanText = text.trim().replace(/[\n\r\t]/g, ' ').replace(/\//g, '|');
    const truncated = cleanText.slice(0, 10);
    const displayTitle = `${truncated}${cleanText.length > 10 ? '...' : ''}`;

    const snippetFile: RawNoteFile = {
      // Structure path so that split('/').pop() returns the display title
      filePath: `snippets/${Date.now()}/${displayTitle}`,
      content: text,
      metadata: { title: t('app.selectedText') }
    };
    
    // Check if duplicate content exists to avoid spamming context with same selection
    setCopilotContextFiles(prev => {
        const exists = prev.some(f => f.content === text);
        if (exists) return prev;
        return [...prev, snippetFile];
    });
  };

  const handleClearRecentFiles = () => {
    if (window.confirm(t('copilot.deleteConfirmTitle'))) {
       setRecentFiles([]);
       localStorage.removeItem("recentFiles");
    }
  };

  // Logic to determine if sidebar is visible (Pinned OR Hovered)
  const sidebarVisible = isSidebarOpen || hoverOpen;

  return (
    // Root container: Uses 100dvh to fix viewport height on mobile, hidden overflow to prevent body scroll
    <div className="h-[100dvh] w-screen bg-gray-50 dark:bg-zinc-950 overflow-hidden flex flex-row relative transition-colors duration-200">
      {/* 1. Edge Hover Sensor (Desktop only, when closed) */}
      {!isSidebarOpen && !isMobile && (
        <div
          className="fixed left-0 top-0 bottom-0 w-4 z-50 cursor-e-resize hover:bg-blue-500/10 transition-colors"
          onMouseEnter={() => setHoverOpen(true)}
        />
      )}

      {/* 2. Sidebar Container */}
      <aside
        ref={sidebarRef}
        className={`
          flex-none h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-40
          transition-[width,transform,background-color] duration-300 ease-in-out
          ${
            isMobile
              ? "fixed inset-y-0 left-0" // Fixed on mobile
              : "relative" // Relative flow on desktop
          }
          ${
            isMobile
              ? isSidebarOpen
                ? "translate-x-0 w-[280px] shadow-2xl"
                : "-translate-x-full w-[280px]"
              : sidebarVisible
                ? "translate-x-0"
                : "w-0 -translate-x-full overflow-hidden border-none"
          }
        `}
        style={!isMobile ? { width: sidebarVisible ? sidebarWidth : 0 } : {}}
        onMouseLeave={() => !isSidebarOpen && setHoverOpen(false)} // Close if it was only open due to hover
      >
        {/* Resizer Handle (Desktop) */}
        {!isMobile && sidebarVisible && (
            <div 
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 hover:bg-blue-500/50 transition-colors"
                onMouseDown={(e) => {
                    e.preventDefault();
                    isResizingSidebar.current = true;
                    document.body.style.cursor = "col-resize";
                    document.body.style.userSelect = "none";
                }}
            />
        )}

        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0 h-16">
          <div>
            <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
              {t('app.title')}
            </h1>
            {isLoading && (
              <div className="flex items-center gap-2 mt-1">
                <LoadingAnimation size="sm" color="bg-zinc-400" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{t('app.loading')}</span>
              </div>
            )}
          </div>
          {/* Close button for Mobile/Hover state */}
          {(isMobile || hoverOpen) && (
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                setHoverOpen(false);
              }}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded md:hidden"
            >
              <svg
                className="w-5 h-5 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Render New Sidebar Component */}
        {error && (
          <div className="p-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/20">
            {t('app.errorPrefix')}{error}
          </div>
        )}
        
        {/* Sidebar Content Wrapper - Crucial for scrolling */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <Sidebar
            rootNode={fileTree}
            onSelect={handleSelectNote}
            selectedId={activeFilePath || ""}
            isLoading={isLoading}
            onRefresh={loadNotes}
            outlineItems={outlineItems}
            showOutline={!!(currentNote && currentNote.filePath.endsWith(".md"))}
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
            onHeadingClick={handleHeadingClick}
            activeHeadingId={activeHeadingId}
          />
        </div>
      </aside>

      {/* 3. Mobile Overlay Backdrop */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 4. Main Content Area */}
      <div
        className={`
        flex-1 h-full min-w-0 flex flex-col transition-all duration-300 relative
        ${isMobile && isSidebarOpen ? "blur-sm scale-[0.98] pointer-events-none select-none" : ""}
      `}
      >
          {/* Top Bar / Header */}
          <header className="h-12 bg-gray-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-end px-2 shrink-0 justify-between z-20 transition-colors duration-200 pt-2 gap-2">
           <div className="flex items-center min-w-0 flex-1 h-full">
             <button
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="p-1.5 mr-2 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 focus:outline-none transition-colors shrink-0 mb-1.5"
               title={isSidebarOpen ? t('app.closeSidebar') : t('app.openSidebar')}
             >
               {isSidebarOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon />}
             </button>

              <div className="flex-1 min-w-0 h-full flex items-end">
                 {isMobile ? (
                    <div className="relative w-full mr-2 self-center mb-1.5">
                      <button 
                        onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
                        className="w-full flex items-center justify-between px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors"
                      >
                        <span className="truncate flex-1 text-left flex items-center gap-2">
                            {currentNote && getFileIcon(currentNote.filePath, "w-4 h-4")}
                            {currentNote 
                              ? (currentNote.metadata?.title || currentNote.filePath.split('/').pop()?.replace(/\.md$/, "")) 
                              : (openFiles.length > 0 ? t('app.selectFile', 'Select File') : t('app.title'))}
                        </span>
                        <ChevronDownIcon className="w-4 h-4 text-zinc-500 ml-2" />
                      </button>
                      
                      {isTabDropdownOpen && (
                         <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                             {openFiles.length === 0 ? (
                                 <div className="p-3 text-xs text-zinc-500 text-center">{t('app.noOpenFiles', 'No open files')}</div>
                             ) : (
                                 openFiles.map(path => (
                                     <div 
                                         key={path} 
                                         className={`flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer ${activeFilePath === path ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                                         onClick={() => { navigate(`/note/${path}`); setIsTabDropdownOpen(false); }}
                                     >
                                        <div className="flex items-center gap-2 truncate">
                                            {getFileIcon(path, "w-4 h-4 shrink-0")}
                                            <span className="truncate text-sm">{path.split('/').pop()?.replace(/\.md$/, "")}</span>
                                        </div>
                                         <button 
                                             onClick={(e) => handleCloseTab(e, path)}
                                             className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded"
                                         >
                                             <CloseIcon className="w-3.5 h-3.5"/>
                                         </button>
                                     </div>
                                 ))
                             )}
                         </div>
                      )}
                    </div>
                 ) : (
                    <div 
                      ref={tabsContainerRef}
                      className="flex items-end h-full w-full overflow-hidden"
                    >
                       {openFiles.length === 0 && (
                           <span className="text-zinc-500 dark:text-zinc-400 font-medium px-2 pb-3 self-center">
                             {t('app.title')}
                           </span>
                       )}
                       {(() => {
                           const minTabWidth = 100;
                           const overflowBtnWidth = 40;
                           const totalWidth = tabsContainerWidth || 800;
                           
                           let visibleTabs = openFiles;
                           let overflowTabs: string[] = [];
                           let showOverflow = false;

                           if (openFiles.length * minTabWidth > totalWidth) {
                               showOverflow = true;
                               const availableWidth = totalWidth - overflowBtnWidth;
                               const maxTabs = Math.max(1, Math.floor(availableWidth / minTabWidth));
                               visibleTabs = openFiles.slice(0, maxTabs);
                               overflowTabs = openFiles.slice(maxTabs);
                           }

                           return (
                               <>
                                   {visibleTabs.map((path, index) => {
                                       const isActive = activeFilePath === path;
                                       const fileName = path.split('/').pop()?.replace(/\.md$/, "");
                                       return (
                                           <div 
                                             key={path}
                                             onClick={() => navigate(`/note/${path}`)}
                                             className={`
                                                 group relative flex items-center min-w-[100px] max-w-[200px] flex-1 h-9 px-3 
                                                 rounded-t-lg cursor-pointer transition-all select-none
                                                 ${isActive 
                                                    ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 z-10' 
                                                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300/50 dark:hover:bg-zinc-800/50 hover:text-zinc-700 dark:hover:text-zinc-200'}
                                             `}
                                           >
                                              {/* Separator (only for inactive tabs and not the last one) */}
                                              {!isActive && index < visibleTabs.length - 1 && visibleTabs[index + 1] !== activeFilePath && (
                                                <div className="absolute right-0 top-2 bottom-2 w-px bg-zinc-300 dark:bg-zinc-700 group-hover:hidden" />
                                              )}

                                              {/* Icon */}
                                              <div className="mr-2 shrink-0 opacity-80">
                                                {getFileIcon(path, "w-4 h-4")}
                                              </div>

                                              {/* Title */}
                                              <span className="truncate text-xs font-medium flex-1 pb-0.5">{fileName}</span>
                                              
                                              {/* Close Button */}
                                              <button
                                                onClick={(e) => handleCloseTab(e, path)}
                                                className={`ml-1 p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                              >
                                                  <CloseIcon className="w-3 h-3" />
                                              </button>
                                           </div>
                                       );
                                   })}

                                   {showOverflow && (
                                       <div className="relative flex items-center justify-center h-9 w-[40px] border-l border-zinc-200 dark:border-zinc-800 mb-0.5" ref={overflowMenuRef}>
                                           <button 
                                               onClick={() => setIsOverflowMenuOpen(!isOverflowMenuOpen)}
                                               className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-500"
                                           >
                                               <ChevronDownIcon className="w-5 h-5" />
                                           </button>
                                           
                                           {isOverflowMenuOpen && (
                                               <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-1">
                                                   {overflowTabs.map(path => (
                                                       <div 
                                                           key={path}
                                                           className={`flex items-center justify-between p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer ${activeFilePath === path ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}
                                                           onClick={() => { navigate(`/note/${path}`); setIsOverflowMenuOpen(false); }}
                                                       >
                                                            <div className="flex items-center gap-2 truncate">
                                                                {getFileIcon(path, "w-4 h-4 shrink-0")}
                                                                <span className="truncate text-sm">{path.split('/').pop()?.replace(/\.md$/, "")}</span>
                                                            </div>
                                                            <button 
                                                                onClick={(e) => handleCloseTab(e, path)}
                                                                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-400 hover:text-red-500"
                                                            >
                                                                <CloseIcon className="w-3.5 h-3.5"/>
                                                            </button>
                                                       </div>
                                                   ))}
                                               </div>
                                           )}
                                       </div>
                                   )}
                               </>
                           );
                       })()}
                    </div>
                 )}
              </div>
           </div>

          <div className="flex items-center gap-2 shrink-0 mb-1.5">
            {/* HTML/JSX/Vue Preview Toggle */}
            {currentNote && (currentNote.filePath.endsWith(".html") || currentNote.filePath.endsWith(".jsx") || currentNote.filePath.endsWith(".vue")) && (
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 mr-2">
                <button
                  onClick={() => setViewMode("preview")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewMode === "preview"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  {t('app.preview')}
                </button>
                <button
                  onClick={() => setViewMode("source")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewMode === "source"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  {t('app.source')}
                </button>
              </div>
            )}

            {/* Stats (Desktop) */}
            {currentNote && (
              <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 shrink-0 hidden sm:flex mr-2">
                {currentNote.metadata?.date && (
                  <span>
                    {new Date(currentNote.metadata.date).toLocaleDateString()}
                  </span>
                )}
                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md transition-colors">
                  {wordCount} {t('app.words')}
                </span>
              </div>
            )}

            {/* Desktop Toolbar */}
            <div className="hidden md:flex items-center gap-1">
              {/* Refresh Button for HTML/JSX/Vue Preview */}
              {(currentNote?.filePath.endsWith(".html") || currentNote?.filePath.endsWith(".jsx") || currentNote?.filePath.endsWith(".vue")) && viewMode === "preview" && (
                <button
                  onClick={handleRefreshHtmlPreview}
                  className="p-2 rounded-md text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
                  title={t('app.refresh')}
                >
                  <RefreshIcon />
                </button>
              )}

              {/* Download Button */}
              {currentNote && (
                <button
                  onClick={handleDownload}
                  className="p-2 rounded-md text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
                  title={t('app.download')}
                >
                  <DownloadIcon />
                </button>
              )}

              {/* Language Switcher */}
              <div className="relative" ref={langMenuRef}>
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="p-2 rounded-md text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
                  title={t('app.changeLanguage')}
                >
                  <LanguageIcon />
                </button>
                
                {isLangMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-md shadow-lg py-1 border border-zinc-200 dark:border-zinc-700 z-50">
                    <button
                      onClick={() => changeLanguage('zh-CN')}
                      className={`block w-full text-left px-4 py-2 text-sm ${i18n.language === 'zh-CN' ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'}`}
                    >
                      简体中文
                    </button>
                    <button
                      onClick={() => changeLanguage('en-US')}
                      className={`block w-full text-left px-4 py-2 text-sm ${i18n.language === 'en-US' ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'}`}
                    >
                      English
                    </button>
                  </div>
                )}
              </div>

              {/* Copilot Toggle Button */}
              <button
                onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                className={`p-2 rounded-md transition-colors focus:outline-none ${
                  isCopilotOpen 
                    ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30" 
                    : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
                title={t('app.copilot')}
              >
                <SparklesIcon />
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={cycleTheme}
                className="p-2 rounded-md text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
                title={`${t('app.theme.' + themeMode)}`}
              >
                {themeMode === "light" && <SunIcon />}
                {themeMode === "dark" && <MoonIcon />}
                {themeMode === "system" && <SystemIcon />}
              </button>

              {/* GitHub Button */}
              <button
                onClick={() => window.open("https://github.com/Glassous/fianotesweb", "_blank")}
                className="p-2 rounded-md text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
                title={t('app.github')}
              >
                <GithubIcon />
              </button>
            </div>

            {/* Mobile Toolbar */}
            <div className="flex md:hidden items-center gap-1">
               {/* Copilot Toggle Button (Mobile) */}
                <button
                onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                className={`p-2 rounded-md transition-colors focus:outline-none ${
                    isCopilotOpen 
                    ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30" 
                    : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
                title={t('app.copilot')}
                >
                <SparklesIcon />
                </button>

                {/* More Menu (Mobile) */}
                <div className="relative" ref={mobileMenuRef}>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 rounded-md text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
                    >
                        <MoreVerticalIcon />
                    </button>

                    {isMobileMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-md shadow-lg py-1 border border-zinc-200 dark:border-zinc-700 z-50">
                             {/* Download */}
                             {currentNote && (
                                <button
                                    onClick={handleDownload}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                                >
                                    <DownloadIcon />
                                    <span>{t('app.download')}</span>
                                </button>
                             )}
                             
                             {/* Language */}
                             <div className="px-4 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-1">
                                {t('app.changeLanguage')}
                             </div>
                             <button
                                onClick={() => changeLanguage('zh-CN')}
                                className={`block w-full text-left px-4 py-2 text-sm ${i18n.language === 'zh-CN' ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'}`}
                             >
                                简体中文
                             </button>
                             <button
                                onClick={() => changeLanguage('en-US')}
                                className={`block w-full text-left px-4 py-2 text-sm ${i18n.language === 'en-US' ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'}`}
                             >
                                English
                             </button>

                             {/* Theme */}
                             <div className="border-t border-zinc-100 dark:border-zinc-700 my-1"></div>
                             <button
                                onClick={() => cycleTheme()}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                             >
                                {themeMode === "light" && <SunIcon />}
                                {themeMode === "dark" && <MoonIcon />}
                                {themeMode === "system" && <SystemIcon />}
                                <span>{t('app.theme.' + themeMode)}</span>
                             </button>

                             {/* GitHub */}
                             <div className="border-t border-zinc-100 dark:border-zinc-700 my-1"></div>
                             <button
                                onClick={() => window.open("https://github.com/Glassous/fianotesweb", "_blank")}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                             >
                                <GithubIcon />
                                <span>{t('app.github')}</span>
                             </button>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
        {/* Scrollable Document Content */}
        <main
          style={{ 
            marginRight: !isMobile && isCopilotOpen && !isCopilotExpanded ? copilotWidth : 0,
            transition: 'margin-right 0.3s ease'
          }}
          className="flex-1 overflow-hidden bg-gray-50 dark:bg-zinc-950 transition-colors duration-200 relative"
        >
          {openFiles.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500 p-4 transition-colors animate-in fade-in duration-500">
              <div className="mb-8 flex flex-col items-center">
                <div className="w-16 h-16 mb-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{t('app.welcomeTitle')}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('app.welcomeSubtitle')}</p>
              </div>

              <div className="grid gap-6 w-full max-w-lg">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => setIsCopilotOpen(true)}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md rounded-xl transition-all group text-left"
                  >
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <SparklesIcon />
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">{t('app.askCopilot')}</span>
                      <span className="block text-xs text-zinc-500 mt-1">{t('app.copilotHelp')}</span>
                    </div>
                  </button>
                </div>

                {/* Recent Files */}
                {recentFiles.length > 0 && (
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-3 ml-1">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t('app.recentFiles')}</h4>
                        <button 
                            onClick={handleClearRecentFiles}
                            className="text-xs text-zinc-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            {t('app.clearRecent')}
                        </button>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                      {recentFiles.map((file) => (
                        <div
                          key={file.filePath}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b last:border-0 border-zinc-100 dark:border-zinc-800 transition-colors group relative"
                        >
                            <button
                                onClick={() => navigate(`/note/${file.filePath}`)}
                                className="absolute inset-0 z-0"
                                aria-label={t('app.open')}
                            />
                          <div className="relative z-10 p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-blue-500 transition-colors pointer-events-none">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0 relative z-10 pointer-events-none">
                            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{file.title}</div>
                            <div className="text-xs text-zinc-400 truncate">{file.filePath}</div>
                          </div>
                          <button
                            onClick={(e) => handleRemoveRecentFile(e, file.filePath)}
                            className="relative z-20 p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                            title={t('app.removeRecent')}
                          >
                             <CloseIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            openFiles.map(filePath => {
                const note = notesData.find(n => n.filePath === filePath);
                const isActive = filePath === activeFilePath;
                
                return (
                    <div 
                        key={filePath}
                        id={`scroll-container-${filePath}`}
                        className={`w-full h-full absolute inset-0 bg-gray-50 dark:bg-zinc-950 flex flex-col ${isActive ? 'z-10' : 'z-0 invisible'}`}
                    >
                        {note?.content ? (
                            <div className="w-full h-full flex flex-col overflow-y-auto">
                            <div className="mx-auto w-full flex-1 flex flex-col">
                                {note.filePath.endsWith(".html") && viewMode === "preview" ? (
                                <iframe
                                    srcDoc={note.content}
                                    className="w-full h-[calc(100vh-4rem)] border-none bg-white"
                                    title="Preview"
                                />
                                ) : note.filePath.endsWith(".jsx") && viewMode === "preview" ? (
                                <div className="w-full flex-1 min-h-0">
                                    <JSXRenderer
                                        key={`${note.filePath}-${refreshKey}`}
                                        code={note.content}
                                        isDark={isDarkMode}
                                    />
                                </div>
                                ) : note.filePath.endsWith(".vue") && viewMode === "preview" ? (
                                <div className="w-full flex-1 min-h-0">
                                    <VueRenderer
                                        key={`${note.filePath}-${refreshKey}`}
                                        code={note.content}
                                        isDark={isDarkMode}
                                    />
                                </div>
                                ) : (note.filePath.endsWith(".html") && viewMode === "source") || (note.filePath.endsWith(".jsx") && viewMode === "source") || (note.filePath.endsWith(".vue") && viewMode === "source") || getLanguageFromExtension(note.filePath) ? (
                                <CodeViewer 
                                    content={note.content} 
                                    language={note.filePath.endsWith(".html") ? "xml" : note.filePath.endsWith(".jsx") ? "jsx" : note.filePath.endsWith(".vue") ? "xml" : getLanguageFromExtension(note.filePath)!} 
                                    isDark={isDarkMode}
                                />
                                ) : (
                                <MarkdownRenderer 
                                    content={note.content} 
                                    isDark={isDarkMode} 
                                    onSelectionAction={handleAskCopilot}
                                    onInternalLinkClick={handleHeadingClick}
                                />
                                )}
                            </div>

                            {(!getLanguageFromExtension(note.filePath) || note.filePath.endsWith(".html") || note.filePath.endsWith(".jsx") || note.filePath.endsWith(".vue")) && (!note.filePath.endsWith(".html") && !note.filePath.endsWith(".jsx") && !note.filePath.endsWith(".vue") || viewMode === "source") && (
                                <div className="p-8 max-w-4xl mx-auto border-t border-zinc-200 dark:border-zinc-800 mt-8 mb-12 transition-colors">
                                <div className="flex flex-wrap gap-2">
                                    {note.metadata?.tags?.map((tag: string) => (
                                    <span
                                        key={tag}
                                        className="text-xs font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded border border-blue-100 dark:border-blue-900/50"
                                    >
                                        #{tag}
                                    </span>
                                    ))}
                                </div>
                                </div>
                            )}
                            </div>
                        ) : (
                            <div className="p-8 max-w-4xl mx-auto space-y-8 mt-8">
                                <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 animate-pulse"></div>
                                <div className="space-y-3">
                                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full animate-pulse"></div>
                                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full animate-pulse"></div>
                                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6 animate-pulse"></div>
                                </div>
                                <div className="space-y-3 pt-4">
                                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full animate-pulse"></div>
                                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4/6 animate-pulse"></div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })
          )}
        </main>

        <CopilotSidebar
          containerRef={copilotRef}
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          notes={notesData}
          fileTree={fileTree}
          activeNote={currentNote || undefined}
          isMobile={isMobile}
          isDarkMode={isDarkMode}
          width={copilotWidth}
          onResizeStart={(e) => {
            e.preventDefault();
            isResizingCopilot.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
          onNoteContentLoad={handleUpdateNoteContent}
          contextFiles={copilotContextFiles}
          setContextFiles={setCopilotContextFiles}
          isExpanded={isCopilotExpanded}
          onToggleExpand={() => setIsCopilotExpanded(!isCopilotExpanded)}
        />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="*" element={<MainLayout />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
