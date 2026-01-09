import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface TexRendererProps {
  content: string;
  scale?: number;
}

export const TexRenderer: React.FC<TexRendererProps> = ({ content, scale = 1 }) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";
    setIsLoading(true);
    setError(null);

    // Check if content contains TikZ
    const hasTikZ = /\\begin\{tikzpicture\}/.test(content);

    // Extract TikZ pictures early for embedding in HTML
    let tikzPictures: string[] = [];
    let contentWithoutTikz = content;
    
    if (hasTikZ) {
      contentWithoutTikz = content.replace(
        /\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g,
        (match) => {
          const index = tikzPictures.length;
          tikzPictures.push(match);
          return `__TIKZ_PLACEHOLDER_${index}__`;
        }
      );
    }

    // Pre-process content for HTML
    let processedContent = contentWithoutTikz
      .replace(/\\documentclass(\[.*?\])?\{.*?\}/g, '')
      .replace(/\\usepackage(\[.*?\])?\{.*?\}/g, '')
      .replace(/\\usetikzlibrary\{.*?\}/g, '')
      .replace(/\\begin\{document\}/g, '')
      .replace(/\\end\{document\}/g, '')
      .replace(/\\title\{(.*?)\}/g, '<h1>$1</h1>')
      .replace(/\\author\{(.*?)\}/g, '<p class="author">$1</p>')
      .replace(/\\date\{(.*?)\}/g, '<p class="date">$1</p>')
      .replace(/\\maketitle/g, '')
      .replace(/\\section\{(.*?)\}/g, '<h2>$1</h2>')
      .replace(/\\subsection\{(.*?)\}/g, '<h3>$1</h3>')
      .replace(/\\subsubsection\{(.*?)\}/g, '<h4>$1</h4>')
      .replace(/\\paragraph\{(.*?)\}/g, '<h5>$1</h5>')
      .replace(/\\textbf\{(.*?)\}/g, '<strong>$1</strong>')
      .replace(/\\textit\{(.*?)\}/g, '<em>$1</em>')
      .replace(/\\emph\{(.*?)\}/g, '<em>$1</em>')
      .replace(/\\texttt\{(.*?)\}/g, '<code>$1</code>')
      .replace(/\\item/g, '<li>')
      .replace(/\\begin\{itemize\}/g, '<ul>')
      .replace(/\\end\{itemize\}/g, '</ul>')
      .replace(/\\begin\{enumerate\}/g, '<ol>')
      .replace(/\\end\{enumerate\}/g, '</ol>')
      .replace(/\\href\{(.*?)\}\{(.*?)\}/g, '<a href="$1">$2</a>')
      .replace(/\\url\{(.*?)\}/g, '<a href="$1">$1</a>')
      .replace(/``/g, '"')
      .replace(/''/g, '"')
      .replace(/---/g, '—')
      .replace(/--/g, '–');

    // Replace TikZ placeholders with script tags in the HTML string
    tikzPictures.forEach((tikzCode, index) => {
      const tikzScript = `<script type="text/tikz">${tikzCode}</script>`;
      processedContent = processedContent.replace(
        `__TIKZ_PLACEHOLDER_${index}__`,
        tikzScript
      );
    });

    // Create HTML content for iframe
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Computer Modern', serif;
            background: white;
            color: #000;
            overflow: auto;
          }
          #content {
            max-width: 800px;
            margin: 0 auto;
            transform-origin: top center;
            transform: scale(${scale});
          }
          .error {
            color: #dc2626;
            background: #fee;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #fca5a5;
            margin: 20px;
          }
          .loading {
            text-align: center;
            padding: 40px;
            color: #666;
          }
          /* TikZ styles */
          svg {
            display: block;
            margin: 20px auto;
            max-width: 100%;
            height: auto;
          }
        </style>
        ${hasTikZ ? '<link rel="stylesheet" type="text/css" href="https://tikzjax.com/v1/fonts.css">' : ''}
        ${hasTikZ ? '<script src="https://tikzjax.com/v1/tikzjax.js"><\/script>' : ''}
        <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>
        <script>
          // Polyfill btoa to handle Unicode characters (fix for TikZJax with non-Latin1 characters)
          (function() {
            const originalBtoa = window.btoa;
            window.btoa = function(str) {
              try {
                // Try original btoa first
                return originalBtoa(str);
              } catch (e) {
                // If it fails, encode UTF-8 properly
                return originalBtoa(unescape(encodeURIComponent(str)));
              }
            };
            
            const originalAtob = window.atob;
            window.atob = function(str) {
              try {
                const decoded = originalAtob(str);
                // Try to decode as UTF-8
                return decodeURIComponent(escape(decoded));
              } catch (e) {
                // Fallback to original
                return originalAtob(str);
              }
            };
          })();
        <\/script>
        <script>
          window.MathJax = {
            tex: {
              inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
              displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
              processEscapes: true,
              processEnvironments: true,
              tags: 'ams',
              packages: {'[+]': ['base', 'ams', 'noerrors', 'noundefined']}
            },
            options: {
              skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
            },
            startup: {
              pageReady: () => {
                return MathJax.startup.defaultPageReady().then(() => {
                  window.parent.postMessage({ type: 'TEX_RENDER_SUCCESS' }, '*');
                });
              }
            }
          };
        <\/script>
      </head>
      <body>
        <div id="loading" class="loading">Rendering LaTeX${hasTikZ ? ' with TikZ graphics' : ''}...</div>
        <div id="content">${processedContent}</div>
        <div id="error" class="error" style="display: none;"></div>
      </body>
      </html>
    `;

    // Create iframe for isolated rendering
    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.backgroundColor = "white";
    // Don't use sandbox attribute to avoid security issues with allow-scripts + allow-same-origin
    // srcdoc provides isolation, and we need full script access for MathJax and TikZJax
    iframe.srcdoc = htmlContent;
    
    container.appendChild(iframe);

    // Wait for MathJax (and TikZJax if needed) to load
    const checkLibraries = setInterval(() => {
      const win = iframe.contentWindow as any;
      if (!win) return;
      
      const mathJaxReady = win.MathJax && win.MathJax.typesetPromise;
      // Check if TikZJax has loaded by looking for the global tex object it creates
      const tikzReady = !hasTikZ || (win.tex !== undefined);
      
      if (mathJaxReady && tikzReady) {
        clearInterval(checkLibraries);
        
        try {
          const iframeDoc = iframe.contentDocument;
          if (!iframeDoc) {
            setError("Cannot access iframe document");
            setIsLoading(false);
            return;
          }

          const contentDiv = iframeDoc.getElementById("content");
          const loadingDiv = iframeDoc.getElementById("loading");
          const errorDiv = iframeDoc.getElementById("error");

          if (!contentDiv) {
            setError("Content container not found");
            setIsLoading(false);
            return;
          }

          // Content is already in the div, just need to process with MathJax
          win.MathJax.typesetPromise([contentDiv])
            .then(() => {
              // Hide loading, show content
              if (loadingDiv) loadingDiv.style.display = "none";
              
              // If TikZ is present, wait for rendering to complete
              if (hasTikZ) {
                const checkTikzRendering = setInterval(() => {
                  const tikzScripts = contentDiv.querySelectorAll('script[type="text/tikz"]');
                  const svgs = contentDiv.querySelectorAll('svg');
                  
                  // TikZJax replaces script tags with SVGs
                  if (tikzScripts.length === 0 || svgs.length > 0) {
                    clearInterval(checkTikzRendering);
                    setIsLoading(false);
                  }
                }, 200);
                
                // Timeout after 15 seconds
                setTimeout(() => {
                  clearInterval(checkTikzRendering);
                  setIsLoading(false);
                }, 15000);
              } else {
                setIsLoading(false);
              }
            })
            .catch((err: Error) => {
              console.error("MathJax rendering error:", err);
              if (errorDiv) {
                errorDiv.textContent = `Rendering error: ${err.message}`;
                errorDiv.style.display = "block";
              }
              if (loadingDiv) loadingDiv.style.display = "none";
              setError(err.message);
              setIsLoading(false);
            });

        } catch (err: any) {
          console.error("TeX processing error:", err);
          setError(err.message);
          setIsLoading(false);
        }
      }
    }, 150);

    // Cleanup timeout after 20 seconds (longer for TikZ)
    const timeout = setTimeout(() => {
      clearInterval(checkLibraries);
      if (isLoading) {
        setError(hasTikZ ? "Libraries failed to load (MathJax/TikZJax). Check browser console for details." : "MathJax failed to load");
        setIsLoading(false);
      }
    }, 20000);

    // Listen for messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "TEX_RENDER_SUCCESS") {
        setIsLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      clearInterval(checkLibraries);
      clearTimeout(timeout);
      window.removeEventListener("message", handleMessage);
    };
  }, [content, scale]);

  return (
    <div className="w-full h-full bg-white dark:bg-zinc-900 overflow-auto">
      {error && (
        <div className="p-4 m-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 font-medium">
            {t("errors.renderFailed", "Rendering failed")}
          </p>
          <p className="text-red-500 dark:text-red-300 text-sm mt-2">{error}</p>
          <p className="text-red-400 dark:text-red-400 text-xs mt-2">
            Check browser console (F12) for more details
          </p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
