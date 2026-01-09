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
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    fill="#239dad"
  >
    <path
      fill="#239dad"
      d="M12.654 17.846q0 1.67.479 2.242q.48.572 1.743.572q1.308 0 3.356-1.319l.871 1.45q-3.835 3.21-6.318 3.209q-2.485 0-3.922-1.187q-1.438-1.23-1.438-4.307V6.989H5.246l-.349-1.626l2.528-.791V2.418L12.654 0v4.835l5.142-.395l-.48 2.857l-4.662-.176z"
    />
  </svg>
);

const TexIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 128 128"
    className={className}
    fill="#008080"
  >
    <path
      fill="#008080"
      d="m78.157 29.987v1.8266c4.1529 0 5.5117 0.15618 7.1818 2.5039l14.586 21.423-13.154 19.216c-3.2453 4.6992-8.1583 4.7817-9.6035 4.7817v1.8264c1.1903-0.0991 2.9161-0.12788 4.4738-0.13747-1.5036 9.5974-3.2903 14.783-15.554 14.783h-10.495c-3.0203 0-3.1629-0.38121-3.1629-2.9827v-21.136h7.1333c7.1332 0 7.8133 2.6139 7.8133 8.9958h1.215v-19.671h-1.215c0 6.2744-0.68131 8.8397-7.8133 8.8397h-7.1345v-18.739c0-2.5528 0.14386-2.9341 3.1629-2.9341h10.338c11.701 0 13.063 4.6504 14.123 14.648h1.3624l-1.8139-16.724h-32.943l-1.2194-16.412h-43.663l-1.2765 16.723h1.359c0.9776-12.525 2.0513-14.718 13.777-14.718h4.1742c1.4439 0.22627 1.444 1.1451 1.444 2.8853v41.162c0 2.7328-0.22893 3.5668-6.5983 3.5668h-2.1464v1.8264c3.6278-0.07 7.4082-0.14381 11.117-0.14381 3.6979 0 7.4895 0.0738 11.115 0.14381v-1.8264h-2.1101c-6.2744 0-6.5006-0.83399-6.5006-3.5668v-41.16c0-1.6702-1.3e-4 -2.5765 1.3612-2.8853h4.1493c11.471 0 12.682 2.1492 13.654 14.405h-3.9804v2.0764c5.3555 0 6.2132 1.2e-4 6.2132 3.3992v40.806c0 3.3991-0.84647 3.399-6.2132 3.399v1.8264h39.349l2.3596-16.592c0.18342-1.1e-4 0.39496-7.5e-4 0.56207-7.5e-4 2.0402 0 5.5943-2.5e-4 7.4783 0.14357v-1.8263c-2.339-0.22628-3.0166-1.7402-3.0166-2.959 0-0.9776 0.37001-1.5139 0.75129-2.0515l12.095-17.652 13.154 19.334c0.59506 0.83633 0.59503 1.0624 0.59503 1.2887 0 0.59506-0.67752 1.8964-3.3253 2.0515v1.8266c2.4215-0.14376 6.1192-0.14381 8.6107-0.14381 1.9577 0 5.7368 5e-5 7.572 0.14381v-1.8266c-4.843 0-5.6055-0.36995-7.1081-2.5039l-16.625-24.322 11.187-16.174c1.1201-1.5877 3.3991-4.8555 9.6035-4.938v-1.8254c-1.7314 0.14377-4.6042 0.14382-6.4181 0.14382-2.4915 0-5.5943-5e-5 -7.4783-0.14382v1.8266c2.4215 0.22627 3.0164 1.7402 3.0164 2.959 0 0.90384-0.37003 1.5138-0.90633 2.2651l-9.9822 14.479-11.187-16.375c-0.52505-0.82383-0.59869-1.0627-0.59869-1.289 0-0.68132 0.82372-1.9687 3.3277-2.04v-1.8254c-2.4215 0.14377-6.1192 0.14382-8.6107 0.14382-1.9577 0-5.7368-5e-5 -7.5632-0.14382z"
    />
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
      return <TypstIcon className={cls} />;
    case "tex":
      return <TexIcon className={cls} />;
    
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
    case "webp":
      return <VscFileMedia className={`${cls} text-purple-400`} />;

    // Documents
    case "pdf":
      return <VscFilePdf className={`${cls} text-red-500`} />;

    default:
      return <VscFile className={`${cls} text-zinc-400`} />;
  }
};
