import React, { useEffect, useRef, useState } from "react";
import { LoadingAnimation } from "./LoadingAnimation";

interface VueRendererProps {
  code: string;
  isDark?: boolean;
}

export const VueRenderer: React.FC<VueRendererProps> = ({ code, isDark }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when code changes
    setLoading(true);
    setError(null);

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      
      if (type === 'VUE_RENDER_READY') {
        setLoading(false);
      } else if (type === 'VUE_RENDER_ERROR') {
        setLoading(false);
        setError(payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [code]);

  // Construct the HTML content for the iframe
  const getIframeContent = () => {
    // Use JSON.stringify for robust string escaping
    const jsonCode = JSON.stringify(code).replace(/<\/script>/g, '<\\/script>');
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vue Preview</title>
        
        <!-- Global Error Handler -->
        <script>
          window.onerror = function(msg, url, line, col, error) {
            const errorMsg = msg + ' (' + line + ':' + col + ')';
            console.error('Preview Error:', errorMsg);
            try { window.parent.postMessage({ type: 'VUE_RENDER_ERROR', payload: errorMsg }, '*'); } catch(e) {}
            const el = document.getElementById('error-display');
            if (el) { el.style.display = 'block'; el.textContent = errorMsg; }
          };
        </script>

        <!-- Tailwind CSS -->
        <script src="https://cdn.tailwindcss.com"></script>
        
        <!-- Vue 3 and SFC Loader -->
        <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/vue3-sfc-loader/dist/vue3-sfc-loader.js"></script>

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
          
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb {
            background: ${isDark ? '#3f3f46' : '#d4d4d8'};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${isDark ? '#52525b' : '#a1a1aa'};
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
        <div id="app"></div>

        <script type="module">
          // Ensure Vue and loader are loaded
          if (!window.Vue || !window['vue3-sfc-loader']) {
             window.parent.postMessage({ type: 'VUE_RENDER_ERROR', payload: "Failed to load Vue or SFC Loader. Check network connection." }, '*');
             throw new Error("Vue dependencies missing");
          }

          const { loadModule } = window['vue3-sfc-loader'];

          const options = {
            moduleCache: {
              vue: Vue
            },
            async getFile(url) {
              if (url === '/component.vue') {
                return ${jsonCode};
              }
              // Handle external imports if possible, or fail gracefully
              // Simple fetch for other files (css, json, etc)
              const res = await fetch(url);
              if ( !res.ok )
                 throw Object.assign(new Error(res.statusText + ' ' + url), { res });
              return {
                 getContentData: asBinary => asBinary ? res.arrayBuffer() : res.text(),
              }
            },
            addStyle(textContent) {
              const style = document.createElement('style');
              style.textContent = textContent;
              const ref = document.head.getElementsByTagName('style')[0] || null;
              document.head.insertBefore(style, ref);
            },
          };

          async function run() {
            try {
              const app = Vue.createApp(
                Vue.defineAsyncComponent(() => loadModule('/component.vue', options))
              );
              app.mount('#app');
              
              // Signal ready
              setTimeout(() => {
                window.parent.postMessage({ type: 'VUE_RENDER_READY' }, '*');
              }, 100);
            } catch (err) {
              console.error(err);
              const msg = err instanceof Error ? err.message : String(err);
              window.parent.postMessage({ type: 'VUE_RENDER_ERROR', payload: msg }, '*');
              
              const el = document.getElementById('error-display');
              if (el) { el.style.display = 'block'; el.textContent = msg; }
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
          <LoadingAnimation size="lg" color="bg-green-500" />
          <p className="mt-4 text-sm text-zinc-500 font-medium animate-pulse">
            Compiling Vue Component...
          </p>
        </div>
      )}

      {/* Error Overlay */}
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
               onClick={() => window.location.reload()} 
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
        title="Vue Preview"
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
      />
    </div>
  );
};
