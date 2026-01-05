import React, { useEffect, useRef, useState } from "react";
import { LoadingAnimation } from "./LoadingAnimation";

interface JSXRendererProps {
  code: string;
  isDark?: boolean;
}

export const JSXRenderer: React.FC<JSXRendererProps> = ({ code, isDark }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when code changes
    setLoading(true);
    setError(null);

    const handleMessage = (event: MessageEvent) => {
      // Security: In production, check event.origin if possible.
      // For srcDoc sandboxed iframe, origin might be "null" or unique.
      
      const { type, payload } = event.data;
      
      if (type === 'JSX_RENDER_READY') {
        setLoading(false);
      } else if (type === 'JSX_RENDER_ERROR') {
        setLoading(false);
        setError(payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [code]);

  // Construct the HTML content for the iframe
  const getIframeContent = () => {
    // Use JSON.stringify for robust string escaping, preventing syntax errors from user code
    // We must still escape </script> to prevent it from closing the script tag prematurely
    const jsonCode = JSON.stringify(code).replace(/<\/script>/g, '<\\/script>');
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JSX Preview</title>
        
        <!-- Global Error Handler (Early) -->
        <script>
          window.onerror = function(msg, url, line, col, error) {
            const errorMsg = msg + ' (' + line + ':' + col + ')';
            console.error('Preview Error:', errorMsg);
            // Try to notify parent
            try { window.parent.postMessage({ type: 'JSX_RENDER_ERROR', payload: errorMsg }, '*'); } catch(e) {}
            // Show in DOM if possible
            const el = document.getElementById('error-display');
            if (el) { el.style.display = 'block'; el.textContent = errorMsg; }
          };
        </script>

        <!-- Use jsDelivr for better performance/reliability than unpkg -->
        <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.6/babel.min.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        
        <!-- Import Map for consistent React versions -->
        <script type="importmap">
        {
          "imports": {
            "react": "https://esm.sh/react@18.2.0?dev",
            "react-dom": "https://esm.sh/react-dom@18.2.0?dev",
            "react-dom/client": "https://esm.sh/react-dom@18.2.0/client?dev",
            "react/jsx-runtime": "https://esm.sh/react@18.2.0/jsx-runtime?dev"
          }
        }
        </script>

        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            color: ${isDark ? '#e4e4e7' : '#27272a'};
            background-color: ${isDark ? '#09090b' : '#ffffff'};
            transition: color 0.2s, background-color 0.2s;
            overflow-x: hidden;
          }
          
          ::-webkit-scrollbar { width: 14px; height: 14px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb {
            background-color: ${isDark ? '#3f3f46' : '#d4d4d8'};
            border-radius: 9999px;
            border: 5px solid transparent;
            background-clip: content-box;
            transition: background-color 0.3s ease;
          }
          ::-webkit-scrollbar-thumb:hover {
            background-color: ${isDark ? '#52525b' : '#a1a1aa'};
            border-width: 3px;
          }

          #error-display {
            display: none;
            color: #ef4444;
            background: ${isDark ? 'rgba(127, 29, 29, 0.2)' : '#fee2e2'};
            border: 1px solid ${isDark ? '#7f1d1d' : '#fecaca'};
            border-radius: 0.5rem;
            padding: 1rem;
            font-family: monospace;
            white-space: pre-wrap;
            margin-bottom: 1rem;
            word-break: break-all;
            font-size: 14px;
            z-index: 50;
            position: relative;
          }
        </style>
      </head>
      <body>
        <div id="error-display"></div>
        <div id="root"></div>

        <script type="module">
          // --- Error Handling & Messaging ---
          const errorDisplay = document.getElementById('error-display');
          
          function reportError(err) {
            console.error(err);
            let msg = err instanceof Error ? err.message : String(err);
            
            // Enhance network error messages
            if (
              msg.includes("Failed to fetch") || 
              msg.includes("NetworkError") || 
              msg.includes("dynamically imported module") ||
              msg.includes("error loading") ||
              msg.includes("Load failed")
            ) {
              msg += "\\n\\n(Network Error: Failed to load external resources. Please check your internet connection. This previewer relies on esm.sh and cdn.jsdelivr.net)";
            }
            
            // Show in iframe
            errorDisplay.style.display = 'block';
            errorDisplay.textContent = msg;
            
            // Notify parent
            window.parent.postMessage({ type: 'JSX_RENDER_ERROR', payload: msg }, '*');
          }

          window.addEventListener('unhandledrejection', function(event) {
            reportError('Unhandled Promise Rejection: ' + event.reason);
          });

          // --- Polyfills / Env ---
          window.process = { env: { NODE_ENV: 'development' } };

          // --- Babel Plugin: Transform Imports ---
          function transformImportSource(babel) {
            return {
              visitor: {
                ImportDeclaration(path) {
                  const source = path.node.source;
                  if (!source.value.startsWith(".") && !source.value.startsWith("/") && !source.value.startsWith("http")) {
                    // Skip react packages as they are handled by importmap
                    if (source.value !== 'react' && source.value !== 'react-dom' && source.value !== 'react-dom/client' && source.value !== 'react/jsx-runtime') {
                        // Mark react as external so esm.sh doesn't bundle it, allowing it to use our importmap version
                        // Note: backticks must be escaped in the template string
                        source.value = \`https://esm.sh/\${source.value}?dev&external=react,react-dom\`;
                    }
                  }
                },
              },
            };
          }

          if (window.Babel) {
            try {
              Babel.registerPlugin("transform-import-source", transformImportSource);
            } catch (e) {
              reportError("Failed to register Babel plugin: " + e.message);
            }
          } else {
            reportError("Babel failed to load. Check network connection.");
          }

          // --- Main Execution ---
          async function run() {
            try {
              // Inject user code safely
              const userCode = ${jsonCode};
              
              if (!window.Babel) return;

              // 1. Compile
              const output = Babel.transform(userCode, {
                presets: [
                  ["react", { runtime: "automatic" }]
                ],
                plugins: ["transform-import-source"],
                filename: "note.jsx",
              });

              // 2. Load Modules
              const encodedCode = encodeURIComponent(output.code);
              const dataUrl = \`data:text/javascript;charset=utf-8,\${encodedCode}\`;

              // Load React from importmap to ensure single instance
              const React = await import("react");
              const ReactDOM = await import("react-dom/client");
              
              const { createRoot } = ReactDOM;
              const { createElement, isValidElement } = React;

              // 3. Import User Component
              const userModule = await import(dataUrl);
              const DefaultExport = userModule.default;

              if (!DefaultExport) {
                throw new Error("No default export found. Please export a React component or element as default.");
              }

              const rootElement = document.getElementById("root");
              const root = createRoot(rootElement);

              if (isValidElement(DefaultExport)) {
                root.render(DefaultExport);
              } else if (typeof DefaultExport === 'function') {
                root.render(createElement(DefaultExport));
              } else {
                 throw new Error("Default export is not a valid React component or element.");
              }
              
              // Notify success
              window.parent.postMessage({ type: 'JSX_RENDER_READY' }, '*');

            } catch (err) {
              reportError(err);
            }
          }

          run();
        </script>
      </body>
      </html>
    `;
  };

  return (
    <div className="w-full h-full relative bg-white dark:bg-zinc-950">
      {/* Loading Overlay */}
      {loading && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm transition-all duration-300">
          <LoadingAnimation size="lg" color="bg-blue-500" />
          <p className="mt-4 text-sm text-zinc-500 font-medium animate-pulse">
            Compiling & Loading Modules...
          </p>
        </div>
      )}

      {/* Error Overlay (if iframe fails to catch it or for logic errors) */}
      {error && (
        <div className="absolute inset-0 z-20 p-8 bg-white dark:bg-zinc-950">
          <div className="max-w-2xl mx-auto">
             <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Runtime Error</h3>
                <pre className="text-sm font-mono whitespace-pre-wrap text-red-600 dark:text-red-300 break-all">
                  {error}
                </pre>
             </div>
             <button 
               onClick={() => window.location.reload()} // Simple refresh fallback
               className="mt-4 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md text-sm font-medium transition-colors"
             >
               Reload Application
             </button>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        srcDoc={getIframeContent()}
        title="JSX Preview"
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
      />
    </div>
  );
};
