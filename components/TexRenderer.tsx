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

    // Create iframe for isolated rendering
    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.backgroundColor = "white";
    
    container.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      setError("Failed to create iframe document");
      setIsLoading(false);
      return;
    }

    // Check if content contains TikZ
    const hasTikZ = /\\begin\{tikzpicture\}/.test(content);

    // Write the HTML structure
    iframeDoc.open();
    iframeDoc.write(`
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
          svg.tikz {
            display: block;
            margin: 20px auto;
            max-width: 100%;
            height: auto;
          }
        </style>
        ${hasTikZ ? '<link rel="stylesheet" type="text/css" href="https://tikzjax.com/v1/fonts.css">' : ''}
        <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        ${hasTikZ ? '<script src="https://tikzjax.com/v1/tikzjax.js"></script>' : ''}
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
        </script>
      </head>
      <body>
        <div id="loading" class="loading">Rendering LaTeX${hasTikZ ? ' with TikZ graphics' : ''}...</div>
        <div id="content" style="display: none;"></div>
        <div id="error" class="error" style="display: none;"></div>
      </body>
      </html>
    `);
    iframeDoc.close();

    // Wait for MathJax (and TikZJax if needed) to load
    const checkLibraries = setInterval(() => {
      const win = iframe.contentWindow as any;
      const mathJaxReady = win && win.MathJax && win.MathJax.typesetPromise;
      const tikzReady = !hasTikZ || (win && win.tikzjax);
      
      if (mathJaxReady && tikzReady) {
        clearInterval(checkLibraries);
        
        try {
          const contentDiv = iframeDoc.getElementById("content");
          const loadingDiv = iframeDoc.getElementById("loading");
          const errorDiv = iframeDoc.getElementById("error");

          if (!contentDiv) {
            setError("Content container not found");
            setIsLoading(false);
            return;
          }

          // Convert LaTeX to HTML-friendly format
          // Preserve TikZ environments and math environments
          let processedContent = content
            .replace(/\\documentclass(\[.*?\])?\{.*?\}/g, '')
            .replace(/\\usepackage(\[.*?\])?\{.*?\}/g, '')
            .replace(/\\usetikzlibrary\{.*?\}/g, '')
            .replace(/\\begin\{document\}/g, '')
            .replace(/\\end\{document\}/g, '')
            .replace(/\\title\{(.*?)\}/g, '<h1>$1</h1>')
            .replace(/\\author\{(.*?)\}/g, '<p class="author">$1</p>')
            .replace(/\\date\{(.*?)\}/g, '<p class="date">$1</p>')
            .replace(/\\maketitle/g, '');

          // Extract and preserve TikZ pictures
          const tikzPictures: string[] = [];
          processedContent = processedContent.replace(
            /\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g,
            (match) => {
              const index = tikzPictures.length;
              tikzPictures.push(match);
              return `<div class="tikz-placeholder" data-index="${index}"></div>`;
            }
          );

          // Continue with other replacements
          processedContent = processedContent
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

          contentDiv.innerHTML = processedContent;

          // Insert TikZ pictures back as script tags for tikzjax to process
          if (hasTikZ && tikzPictures.length > 0) {
            const placeholders = contentDiv.querySelectorAll('.tikz-placeholder');
            placeholders.forEach((placeholder, index) => {
              const script = iframeDoc.createElement('script');
              script.type = 'text/tikz';
              script.textContent = tikzPictures[index];
              placeholder.replaceWith(script);
            });
          }

          // Typeset with MathJax first
          win.MathJax.typesetPromise([contentDiv])
            .then(() => {
              // If TikZ is present, wait a bit for tikzjax to process
              if (hasTikZ) {
                setTimeout(() => {
                  if (loadingDiv) loadingDiv.style.display = "none";
                  contentDiv.style.display = "block";
                  setIsLoading(false);
                }, 1000); // Give tikzjax time to render
              } else {
                if (loadingDiv) loadingDiv.style.display = "none";
                contentDiv.style.display = "block";
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
    }, 100);

    // Cleanup timeout after 15 seconds (longer for TikZ)
    const timeout = setTimeout(() => {
      clearInterval(checkLibraries);
      if (isLoading) {
        setError(hasTikZ ? "Libraries failed to load (MathJax/TikZJax)" : "MathJax failed to load");
        setIsLoading(false);
      }
    }, 15000);

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
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
