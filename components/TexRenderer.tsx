import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoadingAnimation } from "./LoadingAnimation";

interface TexRendererProps {
  content: string;
  scale?: number;
}

export const TexRenderer: React.FC<TexRendererProps> = ({ content, scale = 1 }) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasTikZ, setHasTikZ] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";
    setIsLoading(true);
    setError(null);

    // Check if content contains TikZ
    const contentHasTikZ = /\\begin\{tikzpicture\}/.test(content);
    setHasTikZ(contentHasTikZ);

    // Extract TikZ pictures early for embedding in HTML
    let tikzPictures: string[] = [];
    let contentWithoutTikz = content;
    
    if (contentHasTikZ) {
      contentWithoutTikz = content.replace(
        /\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g,
        (match) => {
          const index = tikzPictures.length;
          // Clean TikZ code: remove problematic decorations and options
          let cleanedTikz = match
            // Remove .expanded which is not supported
            .replace(/\.expanded/g, '')
            // Remove decoration options entirely (not well supported in TikZJax)
            .replace(/,?\s*decoration=\{[^}]*\}/g, '')
            .replace(/,?\s*decoration=[a-zA-Z]+/g, '')
            // Remove decorate option
            .replace(/,?\s*decorate\s*(?=[\],])/g, '')
            // Clean up double commas and trailing commas
            .replace(/,\s*,/g, ',')
            .replace(/\[\s*,/g, '[')
            .replace(/,\s*\]/g, ']');
          tikzPictures.push(cleanedTikz);
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
      // TikZJax only needs the tikzpicture environment, no document wrapper
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
          /* TikZ styles */
          svg {
            display: block;
            margin: 20px auto;
            max-width: 100%;
            height: auto;
          }
          /* Hide TikZ console output */
          .tikzjax-console {
            display: none !important;
          }
          /* Style for TikZ error fallback */
          .tikz-error {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>
        ${contentHasTikZ ? '<link rel="stylesheet" type="text/css" href="https://tikzjax.com/v1/fonts.css">' : ''}
        ${contentHasTikZ ? '<script src="https://tikzjax.com/v1/tikzjax.js"><\/script>' : ''}
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
          
          // Capture TikZJax errors and handle gracefully
          ${contentHasTikZ ? `
          window.addEventListener('error', function(e) {
            if (e.message && e.message.includes('tikz')) {
              console.warn('TikZ rendering error:', e.message);
              // Find all unrendered TikZ scripts and show error message
              const tikzScripts = document.querySelectorAll('script[type="text/tikz"]');
              tikzScripts.forEach(function(script) {
                if (script.parentNode && !script.nextElementSibling) {
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'tikz-error';
                  errorDiv.textContent = 'TikZ rendering failed. The diagram may use unsupported features.\\n\\nOriginal code:\\n' + script.textContent;
                  script.parentNode.insertBefore(errorDiv, script.nextSibling);
                }
              });
              e.preventDefault();
            }
          }, true);
          ` : ''}
        <\/script>
      </head>
      <body>
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
      const tikzReady = !contentHasTikZ || (win.tex !== undefined);
      
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
          const errorDiv = iframeDoc.getElementById("error");

          if (!contentDiv) {
            setError("Content container not found");
            setIsLoading(false);
            return;
          }

          // Content is already in the div, just need to process with MathJax
          win.MathJax.typesetPromise([contentDiv])
            .then(() => {
              // If TikZ is present, wait for rendering to complete
              if (contentHasTikZ) {
                let attempts = 0;
                const maxAttempts = 75; // 15 seconds with 200ms intervals
                
                const checkTikzRendering = setInterval(() => {
                  attempts++;
                  const tikzScripts = contentDiv.querySelectorAll('script[type="text/tikz"]');
                  const svgs = contentDiv.querySelectorAll('svg');
                  const errorDivs = contentDiv.querySelectorAll('.tikz-error');
                  
                  // TikZJax replaces script tags with SVGs, or we show error
                  if (tikzScripts.length === 0 || svgs.length > 0 || errorDivs.length > 0 || attempts >= maxAttempts) {
                    clearInterval(checkTikzRendering);
                    
                    // If timeout and no SVGs, show fallback
                    if (attempts >= maxAttempts && svgs.length === 0 && errorDivs.length === 0) {
                      tikzScripts.forEach((script) => {
                        const errorDiv = iframeDoc.createElement('div');
                        errorDiv.className = 'tikz-error';
                        errorDiv.textContent = 'TikZ rendering timeout. The diagram may be too complex or use unsupported features.\\n\\nOriginal code:\\n' + script.textContent;
                        script.parentNode?.insertBefore(errorDiv, script.nextSibling);
                      });
                    }
                    
                    // Successfully rendered (with or without errors shown inline)
                    setIsLoading(false);
                    setError(null);
                  }
                }, 200);
              } else {
                // No TikZ, rendering complete
                setIsLoading(false);
                setError(null);
              }
            })
            .catch((err: Error) => {
              console.error("MathJax rendering error:", err);
              if (errorDiv) {
                errorDiv.textContent = `Rendering error: ${err.message}`;
                errorDiv.style.display = "block";
              }
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
        setError(contentHasTikZ ? "Libraries failed to load (MathJax/TikZJax). Check browser console for details." : "MathJax failed to load");
        setIsLoading(false);
      }
    }, 20000);

    // Listen for messages from iframe (not used currently but kept for future)
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "TEX_RENDER_SUCCESS") {
        setIsLoading(false);
        setError(null);
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
    <div className="w-full h-full bg-white dark:bg-zinc-900 overflow-auto relative">
      {/* Loading Overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm transition-all duration-300">
          <LoadingAnimation size="lg" color="bg-blue-500" />
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 font-medium animate-pulse">
            {hasTikZ ? "Rendering LaTeX with TikZ graphics..." : "Rendering LaTeX..."}
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-4 left-4 right-4 z-20 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg">
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
