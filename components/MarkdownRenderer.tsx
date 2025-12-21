import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import "github-markdown-css/github-markdown-light.css";
import mermaid from "mermaid";
// @ts-ignore
import { Graphviz } from 'graphviz-react';
import { MapCard } from "./MapCard";

interface MarkdownRendererProps {
  content: string;
  isDark?: boolean;
  variant?: "document" | "chat";
  onSelectionAction?: (text: string) => void;
  onInternalLinkClick?: (id: string) => void;
}

// --- Icons ---
const SparklesIcon = () => (
  <svg
    className="w-4 h-4"
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

const CopyIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="w-4 h-4 text-green-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const ChevronDownIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "-rotate-90" : "rotate-0"}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg
    className="w-4 h-4"
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

// --- Mermaid Block Component (Optimized) ---
// 使用 React.memo 避免不必要的重渲染
const MermaidBlock = React.memo(({ chart, isDark }: { chart: string; isDark: boolean }) => {
  const [svg, setSvg] = useState("");
  // 使用 useMemo 保持 ID 稳定，防止每次重渲染都生成新 ID
  const id = useMemo(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`, []);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? "dark" : "default",
      securityLevel: "loose",
      fontFamily: "inherit",
    });

    const renderChart = async () => {
      // 只有当 chart 有内容时才渲染
      if (!chart) return;
      
      try {
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (error) {
        console.warn("Mermaid rendering failed", error);
        // 渲染失败时，显示错误信息，或者可以根据需求改为“保持上一次状态”
        // 但对于静态只读文件，通常是因为语法错误，显示 Error 比较合适
        setSvg(`<div class="text-red-500 text-xs p-2 border border-red-200 rounded bg-red-50 dark:bg-red-900/20 dark:border-red-800 font-mono">Mermaid Syntax Error</div>`);
      }
    };

    renderChart();
  }, [chart, isDark, id]);

  return (
    <div 
      className="my-6 flex justify-center bg-white dark:bg-[#0d1117] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto"
      style={{ minHeight: "4rem" }} // 设置最小高度防止布局跳动
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
}, (prev, next) => {
  // 自定义比较函数：只有代码或主题变化时才重渲染
  return prev.chart === next.chart && prev.isDark === next.isDark;
});

// --- Graphviz Block Component ---
const GraphvizBlock = React.memo(({ chart, isDark }: { chart: string; isDark: boolean }) => {
  const { t } = useTranslation();
  const [showSource, setShowSource] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleExportSvg = () => {
    const container = containerRef.current;
    if (!container) return;

    const svgElement = container.querySelector('svg');
    if (!svgElement) return;

    // Get the SVG data
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    // Add XML declaration if not present
    if (!source.match(/^<\?xml/)) {
      source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    }

    // Convert to blob and download
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `graphviz-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Graphviz renders usually with black lines, so we force a white background for the diagram itself
  // to ensure visibility in dark mode, unless we want to parse/modify the DOT.
  // Using a simple white container for the graph is the most robust solution.

  return (
    <div className="my-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d1117] overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-100 dark:bg-[#161b22] border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Graphviz
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!showSource && (
            <button
              onClick={handleExportSvg}
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
              title={t('app.exportSvg') || "Export SVG"}
            >
              <DownloadIcon />
              <span className="hidden sm:inline">SVG</span>
            </button>
          )}
          <button
            onClick={() => setShowSource(!showSource)}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            {showSource ? t('app.preview') : t('app.source')}
          </button>
        </div>
      </div>

      <div className={`p-4 overflow-x-auto ${!showSource ? "flex justify-center bg-white" : ""}`}>
        {showSource ? (
          <pre className="text-sm font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap m-0">
            {chart}
          </pre>
        ) : (
          <div className="graphviz-wrapper" ref={containerRef}>
             {/* @ts-ignore */}
            <Graphviz
              dot={chart}
              options={{ height: "100%", width: "100%", zoom: false, fit: true }}
            />
          </div>
        )}
      </div>
    </div>
  );
}, (prev, next) => prev.chart === next.chart && prev.isDark === next.isDark);

// --- Custom Pre Block Component ---
const PreBlock = ({ children, isDark }: { children: React.ReactNode; isDark: boolean }) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  let language = "text";
  let codeText = "";

  if (React.isValidElement(children)) {
    const props = children.props as any;
    if (props.className) {
      const match = /language-(\w+)/.exec(props.className || "");
      if (match) language = match[1];
    }
    if (typeof props.children === "string") {
      codeText = props.children;
    } else if (Array.isArray(props.children)) {
      codeText = props.children
        .map((c: any) => (typeof c === "string" ? c : ""))
        .join("");
    }
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(codeText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    });
  };

  const customStyle = {
    margin: 0,
    padding: "1rem",
    background: "transparent",
    fontSize: "0.875rem",
    lineHeight: "1.5",
  };

  return (
    <div className="my-6 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d1117] shadow-sm max-w-full">
      <div
        className="flex items-center justify-between px-4 py-2 bg-zinc-100 dark:bg-[#161b22] border-b border-zinc-200 dark:border-zinc-800 select-none cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-all active:scale-95"
            title={t('markdown.copyCode')}
          >
            {isCopied ? <CheckIcon /> : <CopyIcon />}
            <span>{isCopied ? t('markdown.copied') : t('markdown.copy')}</span>
          </button>
          <button
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            title={isCollapsed ? t('markdown.expand') : t('markdown.collapse')}
          >
            <ChevronDownIcon collapsed={isCollapsed} />
          </button>
        </div>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out ${isCollapsed ? "max-h-0 opacity-0" : "max-h-[2000px] opacity-100"}`}
      >
        <div className="relative w-full">
          <SyntaxHighlighter
            language={language}
            style={isDark ? vscDarkPlus : vs}
            customStyle={customStyle}
            wrapLines={true}
            PreTag="div"
            CodeTag="div"
          >
            {codeText}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
};

// --- Thinking Block Component ---
const ThinkingBlock = ({ content, isDark }: { content: string; isDark: boolean }) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="my-3 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-900/50">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left select-none"
      >
        <SparklesIcon />
        <span className="flex-1">{t('copilot.thinkingProcess')}</span>
        <ChevronDownIcon collapsed={isCollapsed} />
      </button>
      
      <div
        className={`transition-all duration-300 ease-in-out px-3 text-sm text-zinc-600 dark:text-zinc-400 font-mono overflow-hidden ${
          isCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100 py-3 border-t border-zinc-200 dark:border-zinc-800 overflow-y-auto"
        }`}
      >
        <div className="whitespace-pre-wrap opacity-80">{content}</div>
      </div>
    </div>
  );
};

// --- Heading Helper ---
const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getNodeText = (node: any): string => {
  if (node == null) return "";
  if (['string', 'number'].includes(typeof node)) return node.toString();
  if (node instanceof Array) return node.map(getNodeText).join('');
  if (typeof node === 'object' && node.props) return getNodeText(node.props.children);
  return "";
};

const Heading = ({ level, children, ...props }: any) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const text = getNodeText(children);
  const id = slugify(text);
  return <Tag id={id} {...props}>{children}</Tag>;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isDark = false,
  variant = "document",
  onSelectionAction,
  onInternalLinkClick,
}) => {
  const { t } = useTranslation();
  const containerClasses = variant === "document"
    ? "markdown-body p-8 bg-white dark:bg-zinc-950 min-h-screen transition-colors duration-200 text-zinc-900 dark:text-zinc-100 relative"
    : "markdown-body bg-transparent text-zinc-800 dark:text-zinc-200 text-sm"; 

  const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('#fia-copilot-selection-btn')) return;
        setSelectionMenu(null);
    };
    
    if (selectionMenu) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectionMenu]);

  const handleMouseUp = () => {
      if (!onSelectionAction || variant !== "document") return;
      
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
          return; 
      }
      
      const text = selection.toString().trim();
      if (!text) return;
      
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectionMenu({
          x: rect.left + rect.width / 2,
          y: rect.top - 8,
          text: text
      });
  };

  // --------------------------------------------------------------------------------
  // 关键修复：使用 useMemo 缓存 components 对象
  // 这防止了每次父组件渲染时重新挂载所有子组件（包括 MermaidBlock），
  // 从而解决了 Mermaid 图表闪烁和不稳定的问题。
  // --------------------------------------------------------------------------------
  const markdownComponents: Components = useMemo(() => ({
    code: ({ className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      const isInline = !match && !String(children).includes("\n");
      
      if (isInline) {
          return (
            <code className={className} {...props}>
              {children}
            </code>
          )
      }

      if (match && match[1] === "mermaid") {
        return (
          <MermaidBlock 
            chart={String(children).replace(/\n$/, "")} 
            isDark={isDark} 
          />
        );
      }

      if (match && (match[1] === "graphviz" || match[1] === "dot")) {
        return (
          <GraphvizBlock
            chart={String(children).replace(/\n$/, "")}
            isDark={isDark}
          />
        );
      }
      
      return (
        <PreBlock isDark={isDark}>
            <code className={className} {...props}>
              {children}
            </code>
        </PreBlock>
      );
    },
    pre: ({ children }: any) => <>{children}</>,
    h1: (props: any) => <Heading level={1} {...props} />,
    h2: (props: any) => <Heading level={2} {...props} />,
    h3: (props: any) => <Heading level={3} {...props} />,
    h4: (props: any) => <Heading level={4} {...props} />,
    h5: (props: any) => <Heading level={5} {...props} />,
    h6: (props: any) => <Heading level={6} {...props} />,
    a: ({ node, ...props }: any) => {
      const href = props.href || "";
      const isInternal = href.startsWith("#");
      
      if (isInternal) {
          return (
              <a 
                  {...props} 
                  onClick={(e) => {
                      e.preventDefault();
                      const id = href.substring(1);
                      onInternalLinkClick && onInternalLinkClick(id);
                  }}
                  className="cursor-pointer hover:underline text-blue-600 dark:text-blue-400"
              />
          );
      }
      
      return (
        <a target="_blank" rel="noopener noreferrer" {...props} />
      );
    },
    img: ({ node, ...props }: any) => {
      const src = props.src || "";
      // Intercept our special internal map URL
      if (src.startsWith("https://fianotes-map-internal/view")) {
        try {
          // Use path based parsing which is more robust against URL encoding
          // Expected format: https://fianotes-map-internal/view/LAT/LNG
          const parts = src.split('/');
          if (parts.length >= 6) {
             const latStr = parts[4];
             const lngStr = parts[5];
             const lat = parseFloat(latStr);
             const lng = parseFloat(lngStr);
             
             if (!isNaN(lat) && !isNaN(lng)) {
               return <MapCard lat={lat} lng={lng} rawText={`[map:${lat},${lng}]`} />;
             }
          }
          
          // Fallback to query param parsing if path parsing failed (for backward compatibility during dev)
          const url = new URL(src);
          const lat = parseFloat(url.searchParams.get("lat") || "");
          const lng = parseFloat(url.searchParams.get("lng") || "");
          
          if (!isNaN(lat) && !isNaN(lng)) {
            return <MapCard lat={lat} lng={lng} rawText={`[map:${lat},${lng}]`} />;
          }
        } catch (e) {
          console.error("Failed to parse map URL", e);
        }
        
        // Return null or a placeholder div to prevent browser from trying to fetch the broken URL
        return (
            <div className="p-2 border border-red-200 rounded bg-red-50 text-red-500 text-xs font-mono">
                Map Error: Invalid coordinates
            </div>
        );
      }
      return <img {...props} />;
    },
  }), [isDark, onInternalLinkClick]); // 只有当 isDark 或 点击回调 变化时才更新

  // Split content by <think> tags
  const parts = content.split(/(<think>[\s\S]*?<\/think>|<think>[\s\S]*)/g);

  return (
    <div className={containerClasses} onMouseUp={handleMouseUp}>
      <style>{`
        .markdown-body {
          background-color: transparent !important;
          font-family: inherit;
          min-height: auto !important;
        }
        
        .markdown-body pre {
            white-space: pre;
            overflow-x: auto;
            background-color: transparent !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
        }

        .dark .markdown-body {
          color-scheme: dark;
          color: #e4e4e7;
        }

        .dark .markdown-body h1,
        .dark .markdown-body h2,
        .dark .markdown-body h3,
        .dark .markdown-body h4,
        .dark .markdown-body h5,
        .dark .markdown-body h6 {
          color: #f4f4f5;
          border-bottom-color: #3f3f46;
        }

        .dark .markdown-body a {
          color: #60a5fa;
        }
        
        .dark .markdown-body blockquote {
          color: #a1a1aa;
          border-left-color: #3f3f46;
        }
        
        .dark .markdown-body hr {
          background-color: #3f3f46;
          height: 1px;
        }
        
        .dark .markdown-body table tr {
          background-color: transparent;
          border-color: #3f3f46;
        }
        .dark .markdown-body table tr:nth-child(2n) {
          background-color: rgba(63, 63, 70, 0.2);
        }
        .dark .markdown-body table th,
        .dark .markdown-body table td {
          border-color: #3f3f46;
        }
        
        .dark .markdown-body code:not([class*="language-"]) {
          background-color: rgba(63, 63, 70, 0.4);
          color: #e4e4e7;
        }

        .dark ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .dark ::-webkit-scrollbar-track {
          background: #18181b;
        }
        .dark ::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 4px;
        }
        .dark ::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}</style>

      {parts.map((part, index) => {
        if (part.startsWith("<think>")) {
          let inner = part.replace("<think>", "");
          if (inner.endsWith("</think>")) {
            inner = inner.slice(0, -8);
          }
          return <ThinkingBlock key={index} content={inner} isDark={isDark} />;
        }
        
        if (!part) return null;

        // Transform [map:lat,lng] to internal image syntax
        const processedPart = part.replace(
            /\[map:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]/g, 
            (match, lat, lng) => `![map-view](https://fianotes-map-internal/view?lat=${lat}&lng=${lng})`
        );

        return (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            // 传入 memoized 的 components
            components={markdownComponents}
          >
            {processedPart}
          </ReactMarkdown>
        );
      })}

      {selectionMenu && (
        <button
          id="fia-copilot-selection-btn"
          onClick={(e) => {
              e.stopPropagation();
              onSelectionAction && onSelectionAction(selectionMenu.text);
              setSelectionMenu(null);
              window.getSelection()?.removeAllRanges();
          }}
          className="fixed z-50 flex items-center gap-2 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full shadow-lg hover:scale-105 transition-transform animate-in fade-in zoom-in duration-200 cursor-pointer"
          style={{
              left: selectionMenu.x,
              top: selectionMenu.y,
              transform: 'translate(-50%, -100%)'
          }}
        >
          <SparklesIcon />
          <span className="text-xs font-semibold whitespace-nowrap">{t('app.askCopilot')}</span>
        </button>
      )}
    </div>
  );
};