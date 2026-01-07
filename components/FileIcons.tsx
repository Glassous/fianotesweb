import React from "react";
import {
  VscFolder,
  VscFolderOpened,
  VscFile,
  VscMarkdown,
  VscJson,
  VscFileMedia,
  VscCode,
  VscTerminal,
  VscDatabase,
  VscFilePdf,
} from "react-icons/vsc";
import { FaJava } from "react-icons/fa";
import {
  SiJavascript,
  SiTypescript,
  SiHtml5,
  SiCss3,
  SiPython,
  SiCplusplus,
  SiRust,
  SiGo,
  SiReact,
  SiKotlin,
  SiPhp,
  SiRuby,
  SiDotnet,
  SiSwift,
  SiLua,
  SiR,
  SiDart,
  SiGnubash,
  SiYaml,
  SiVuedotjs,
} from "react-icons/si";

const TypstIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M23.99 4.384v5.353c0 .322-.26.584-.582.584h-4.326c-.322 0-.583-.262-.583-.584V4.384H12.984v14.65h5.515c.32 0 .582.26.582.583v4.383c0 .322-.262.583-.582.583H5.5c-.322 0-.583-.26-.583-.583v-4.383c0-.322.26-.583.583-.583h5.515V4.384H5.499v5.353c0 .322-.26.584-.583.584H.583C.262 10.321 0 10.06 0 9.737V4.384C0 2.22 1.942.27 4.106.27h15.778c2.164 0 4.106 1.95 4.106 4.114z"/>
  </svg>
);

interface IconProps {
  className?: string;
}

export const FolderIcon: React.FC<{ open: boolean; className?: string }> = ({
  open,
  className,
}) => {
  const Icon = open ? VscFolderOpened : VscFolder;
  return (
    <Icon
      className={`w-4 h-4 ${
        open ? "text-yellow-500" : "text-yellow-500"
      } ${className || ""}`}
    />
  );
};

export const getFileIcon = (fileName: string, className?: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const cls = `w-4 h-4 ${className || ""}`;

  switch (ext) {
    // Web
    case "js":
      return <SiJavascript className={`${cls} text-yellow-400`} />;
    case "jsx":
      return <SiReact className={`${cls} text-cyan-400`} />;
    case "ts":
      return <SiTypescript className={`${cls} text-blue-500`} />;
    case "tsx":
      return <SiReact className={`${cls} text-blue-500`} />;
    case "html":
      return <SiHtml5 className={`${cls} text-orange-500`} />;
    case "css":
      return <SiCss3 className={`${cls} text-blue-400`} />;
    case "json":
      return <VscJson className={`${cls} text-yellow-600`} />;
    case "xml":
      return <VscCode className={`${cls} text-orange-400`} />;
    case "vue":
      return <SiVuedotjs className={`${cls} text-green-500`} />;
    case "typ":
      return <VscCode className={`${cls} text-teal-600`} />;
    
    // Markdown
    case "md":
      return <VscMarkdown className={`${cls} text-blue-400`} />;
    
    // Systems
    case "c":
    case "h":
      return <SiCplusplus className={`${cls} text-blue-600`} />;
    case "cpp":
    case "hpp":
      return <SiCplusplus className={`${cls} text-blue-600`} />;
    case "rs":
      return <SiRust className={`${cls} text-orange-600`} />;
    case "go":
      return <SiGo className={`${cls} text-cyan-500`} />;
    case "java":
      return <FaJava className={`${cls} text-red-500`} />;
    case "cs":
      return <SiDotnet className={`${cls} text-purple-600`} />;

    // Scripting
    case "py":
      return <SiPython className={`${cls} text-blue-500`} />;
    case "sh":
    case "bash":
      return <SiGnubash className={`${cls} text-zinc-500`} />;
    case "ps1":
    case "bat":
    case "cmd":
      return <VscTerminal className={`${cls} text-blue-600`} />;
    case "lua":
      return <SiLua className={`${cls} text-blue-800`} />;
    case "php":
      return <SiPhp className={`${cls} text-indigo-400`} />;
    case "rb":
      return <SiRuby className={`${cls} text-red-600`} />;
    case "r":
      return <SiR className={`${cls} text-blue-600`} />;
    case "dart":
      return <SiDart className={`${cls} text-cyan-500`} />;
    case "swift":
      return <SiSwift className={`${cls} text-orange-500`} />;
    case "kt":
    case "kts":
      return <SiKotlin className={`${cls} text-purple-500`} />;

    // Data/Config
    case "sql":
      return <VscDatabase className={`${cls} text-green-500`} />;
    case "yaml":
    case "yml":
      return <SiYaml className={`${cls} text-purple-400`} />;
    
    // Images
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
    case "ico":
      return <VscFileMedia className={`${cls} text-purple-400`} />;

    // Documents
    case "pdf":
      return <VscFilePdf className={`${cls} text-red-500`} />;

    default:
      return <VscFile className={`${cls} text-zinc-400`} />;
  }
};
