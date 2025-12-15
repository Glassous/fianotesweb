import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeViewerProps {
  content: string;
  language: string;
  isDark?: boolean;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  content,
  language,
  isDark = false,
}) => {
  const customStyle = {
    margin: 0,
    padding: "1.5rem", // More comfortable padding for full page
    background: "transparent",
    fontSize: "0.875rem", // 14px
    lineHeight: "1.6",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  };

  return (
    <div className="w-full h-full min-h-screen bg-white dark:bg-zinc-950 text-sm transition-colors duration-200">
      <SyntaxHighlighter
        language={language}
        style={isDark ? vscDarkPlus : vs}
        customStyle={customStyle}
        showLineNumbers={true}
        wrapLines={true}
        lineNumberStyle={{
          minWidth: "3em",
          paddingRight: "1em",
          color: isDark ? "#6e7681" : "#bbb",
          textAlign: "right",
        }}
        PreTag="div"
        CodeTag="div"
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};
