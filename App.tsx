import React, { useEffect, useState, useMemo } from "react";
import {
  HashRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import { buildFileTree } from "./utils/transform";
import { parseFrontmatter } from "./utils/frontmatter";
import { MOCK_NOTES } from "./constants";
import { RawNoteFile, NoteItem } from "./types";
import { fetchNotesTree, fetchNoteContent, isGitHubConfigured } from "./services/github";

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

const CloseIcon = () => (
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
      d="M6 18L18 6M6 6l12 12"
    />
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

type ThemeMode = "system" | "light" | "dark";

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const rawPath = params["*"];

  // --- State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hoverOpen, setHoverOpen] = useState(false); // For edge hover

  // Data State
  const [notesData, setNotesData] = useState<RawNoteFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  // --- Theme State & Logic ---
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem("theme") as ThemeMode) || "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const systemQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (mode: ThemeMode) => {
      const isDark =
        mode === "dark" || (mode === "system" && systemQuery.matches);
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

  // Effect: On Mount, if there is a path, clear it.
  useEffect(() => {
    if (location.pathname !== "/") {
      navigate("/", { replace: true });
    }
  }, []); // Run once on mount

  const currentNote = useMemo(() => {
    if (!activeFilePath) return null;
    return notesData.find((n) => n.filePath === activeFilePath);
  }, [activeFilePath, notesData]);

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

  // Word count calculation
  const wordCount = useMemo(() => {
    if (!currentNote?.content) return 0;
    return currentNote.content.split(/\s+/).filter(Boolean).length;
  }, [currentNote]);

  const handleSelectNote = (note: NoteItem) => {
    // Navigate using the 'note' prefix to distinguish from other potential routes
    navigate(`/note/${note.path}`);
  };

  // Logic to determine if sidebar is visible (Pinned OR Hovered)
  const sidebarVisible = isSidebarOpen || hoverOpen;

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-zinc-950 overflow-hidden relative transition-colors duration-200">
      {/* 1. Edge Hover Sensor (Desktop only, when closed) */}
      {!isSidebarOpen && !isMobile && (
        <div
          className="fixed left-0 top-0 bottom-0 w-4 z-50 cursor-e-resize hover:bg-blue-500/10 transition-colors"
          onMouseEnter={() => setHoverOpen(true)}
        />
      )}

      {/* 2. Sidebar Container */}
      <aside
        className={`
          fixed md:relative z-40 h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col
          transition-[width,transform,background-color] duration-300 ease-in-out
          ${
            isMobile
              ? isSidebarOpen
                ? "translate-x-0 w-[280px] shadow-2xl"
                : "-translate-x-full w-[280px]"
              : sidebarVisible
                ? "w-72 translate-x-0"
                : "w-0 -translate-x-full overflow-hidden border-none"
          }
        `}
        onMouseLeave={() => !isSidebarOpen && setHoverOpen(false)} // Close if it was only open due to hover
      >
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0 h-16">
          <div>
            <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
              FiaNotes
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isLoading ? "Loading..." : "Knowledge Base"}
            </p>
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
            Error: {error}
          </div>
        )}
        <Sidebar
          rootNode={fileTree}
          onSelect={handleSelectNote}
          selectedId={activeFilePath || ""}
          isLoading={isLoading}
          onRefresh={loadNotes}
        />
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
        flex-1 flex flex-col h-full overflow-hidden transition-all duration-300
        ${isMobile && isSidebarOpen ? "blur-sm scale-[0.98] pointer-events-none select-none" : ""}
      `}
      >
        {/* Top Bar / Header */}
        <header className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 shrink-0 justify-between z-20 transition-colors duration-200">
          <div className="flex items-center min-w-0 mr-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 mr-4 -ml-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 focus:outline-none transition-colors"
              title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              {isSidebarOpen ? <CloseIcon /> : <MenuIcon />}
            </button>

            {currentNote ? (
              <div className="flex flex-col truncate">
                <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {currentNote.metadata?.title ||
                    currentNote.filePath.split("/").pop()?.replace(/\.md$/, "")}
                </h2>
                <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400 truncate space-x-2">
                  <span>{currentNote.filePath}</span>
                </div>
              </div>
            ) : (
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                FiaNotes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Stats (Desktop) */}
            {currentNote && (
              <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 shrink-0 hidden sm:flex mr-2">
                {currentNote.metadata?.date && (
                  <span>
                    {new Date(currentNote.metadata.date).toLocaleDateString()}
                  </span>
                )}
                <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md transition-colors">
                  {wordCount} words
                </span>
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={cycleTheme}
              className="p-2 rounded-md text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
              title={`Theme: ${themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}`}
            >
              {themeMode === "light" && <SunIcon />}
              {themeMode === "dark" && <MoonIcon />}
              {themeMode === "system" && <SystemIcon />}
            </button>
          </div>
        </header>

        {/* Scrollable Document Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-zinc-950 scroll-smooth transition-colors duration-200">
          {currentNote?.content ? (
            <div className="w-full min-h-full">
              {/* Note: max-w-none is handled in MarkdownRenderer, removing container constraints here allows full width */}
              <div className="mx-auto w-full">
                <MarkdownRenderer content={currentNote.content} />
              </div>

              {/* Footer Metadata in Document Flow */}
              <div className="p-8 max-w-4xl mx-auto border-t border-zinc-200 dark:border-zinc-800 mt-8 mb-12 transition-colors">
                <div className="flex flex-wrap gap-2">
                  {currentNote.metadata?.tags?.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded border border-blue-100 dark:border-blue-900/50"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : contentLoading ? (
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
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500 p-4 transition-colors">
              <svg
                className="w-16 h-16 mb-4 text-zinc-200 dark:text-zinc-800"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">
                Select a note to begin reading
              </p>
            </div>
          )}
        </main>
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
