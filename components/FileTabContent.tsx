import React, { useCallback } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { CodeViewer } from "./CodeViewer";
import { JSXRenderer } from "./JSXRenderer";
import { VueRenderer } from "./VueRenderer";
import { PDFViewer } from "./PDFViewer";
import { TypstRenderer } from "./TypstRenderer";
import { getLanguageFromExtension } from "../utils/transform";
import { RawNoteFile } from "../types";

interface FileTabContentProps {
  filePath: string;
  isActive: boolean;
  note?: RawNoteFile;
  viewMode: "preview" | "source";
  isResizing: boolean;
  refreshKey: number;
  isDarkMode: boolean;
  onAskCopilot: (text: string) => void;
  markdownAlign?: "left" | "center";
  typstScale?: number;
  markdownScale?: number;
}

export const FileTabContent: React.FC<FileTabContentProps> = React.memo(({
  filePath,
  isActive,
  note,
  viewMode,
  isResizing,
  refreshKey,
  isDarkMode,
  onAskCopilot,
  markdownAlign = "left",
  typstScale = 1,
  markdownScale = 1,
}) => {
  // Stable click handler for this specific file tab
  // This ensures that switching tabs (changing activeFilePath) does not recreate this function
  // and therefore does not cause MarkdownRenderer to re-render and unmount Mermaid components.
  const handleHeadingClick = useCallback((id: string) => {
    const element = document.getElementById(id);
    const container = document.getElementById(`scroll-container-${filePath}`);

    if (element && container) {
      const elementRect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const currentScroll = container.scrollTop;
      const targetTop = currentScroll + (elementRect.top - containerRect.top) - 24;

      container.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
    }
  }, [filePath]);

  return (
    <div 
        className={`w-full h-full absolute inset-0 bg-gray-50 dark:bg-zinc-950 flex flex-col ${isActive ? 'z-10' : 'z-0 invisible'}`}
    >
        {note?.content ? (
            <div 
                id={`scroll-container-${filePath}`}
                className="w-full h-full flex flex-col overflow-y-auto"
            >
            <div className="mx-auto w-full flex-1 flex flex-col">
                {note.filePath.endsWith(".html") && viewMode === "preview" ? (
                <iframe
                    srcDoc={note.content}
                    className={`w-full h-full border-none bg-white ${isResizing ? "pointer-events-none" : ""}`}
                    title="Preview"
                />
                ) : note.filePath.endsWith(".jsx") && viewMode === "preview" ? (
                <div className={`w-full flex-1 min-h-0 ${isResizing ? "pointer-events-none" : ""}`}>
                    <JSXRenderer
                        key={`${note.filePath}-${refreshKey}`}
                        code={note.content}
                        isDark={isDarkMode}
                    />
                </div>
                ) : note.filePath.endsWith(".vue") && viewMode === "preview" ? (
                <div className={`w-full flex-1 min-h-0 ${isResizing ? "pointer-events-none" : ""}`}>
                    <VueRenderer
                        key={`${note.filePath}-${refreshKey}`}
                        code={note.content}
                        isDark={isDarkMode}
                    />
                </div>
                ) : note.filePath.endsWith(".pdf") ? (
                <div className={`w-full h-full bg-white dark:bg-zinc-900 ${isResizing ? "pointer-events-none" : ""}`}>
                    <PDFViewer
                        file={note.content}
                        isDark={isDarkMode}
                    />
                </div>
                ) : note.filePath.endsWith(".typ") ? (
                <div className={`w-full flex-1 min-h-0 ${isResizing ? "pointer-events-none" : ""}`}>
                    <TypstRenderer
                        key={`${note.filePath}-${refreshKey}`}
                        code={note.content}
                        isDark={isDarkMode}
                        viewMode={viewMode}
                        scale={typstScale}
                    />
                </div>
                ) : (note.filePath.endsWith(".html") && viewMode === "source") || (note.filePath.endsWith(".jsx") && viewMode === "source") || (note.filePath.endsWith(".vue") && viewMode === "source") || (note.filePath.endsWith(".typ") && viewMode === "source") || (note.filePath.endsWith(".md") && viewMode === "source") || getLanguageFromExtension(note.filePath) ? (
                <CodeViewer 
                    content={note.content} 
                    language={note.filePath.endsWith(".html") ? "xml" : note.filePath.endsWith(".jsx") ? "jsx" : note.filePath.endsWith(".vue") ? "xml" : note.filePath.endsWith(".typ") ? "typst" : note.filePath.endsWith(".md") ? "markdown" : getLanguageFromExtension(note.filePath)!} 
                    isDark={isDarkMode}
                />
                ) : (
                <div className={`w-full flex-1 min-h-0 ${isResizing ? "pointer-events-none" : ""}`}>
                    <MarkdownRenderer 
                        content={note.content} 
                        isDark={isDarkMode} 
                        onSelectionAction={onAskCopilot}
                        onInternalLinkClick={handleHeadingClick}
                        align={markdownAlign}
                        scale={markdownScale}
                    />
                </div>
                )}
            </div>
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
});
