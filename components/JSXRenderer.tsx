import React, { useEffect, useRef, useState } from "react";
import { LoadingAnimation } from "./LoadingAnimation";

interface JSXRendererProps {
  code: string;
  isDark?: boolean;
}

export const JSXRenderer: React.FC<JSXRendererProps> = ({ code, isDark }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Construct the HTML content for the iframe
  const getIframeContent = () => {
    // Escape backticks and other special characters in the user code to safely inject it into the template string
    // Also escape closing script tags to prevent breaking the HTML
    const safeCode = code
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$')
      .replace(/<\/script>/g, '<\\/script>');
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JSX Preview</title>
        <!-- Load React, ReactDOM, and Babel -->
        <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            color: ${isDark ? '#e4e4e7' : '#27272a'}; /* zinc-200 : zinc-800 */
            background-color: ${isDark ? '#09090b' : '#ffffff'}; /* zinc-950 : white */
            transition: color 0.2s, background-color 0.2s;
          }
          
          /* Custom Scrollbar to match app */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: ${isDark ? '#3f3f46' : '#d4d4d8'};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${isDark ? '#52525b' : '#a1a1aa'};
          }

          #error-container {
            display: none;
            color: #ef4444;
            background: ${isDark ? 'rgba(127, 29, 29, 0.2)' : '#fee2e2'};
            border: 1px solid ${isDark ? '#7f1d1d' : '#fecaca'};
            border-radius: 0.5rem;
            padding: 1rem;
            font-family: monospace;
            white-space: pre-wrap;
            margin-bottom: 1rem;
          }
        </style>
      </head>
      <body>
        <div id="error-container"></div>
        <div id="root"></div>

        <script>
          const errorContainer = document.getElementById('error-container');
          
          function showError(err) {
            console.error(err);
            errorContainer.style.display = 'block';
            errorContainer.textContent = err.toString();
          }

          window.onerror = function(message, source, lineno, colno, error) {
            showError(message + ' (' + lineno + ':' + colno + ')');
          };

          window.addEventListener('unhandledrejection', function(event) {
            showError('Unhandled Promise Rejection: ' + event.reason);
          });

          try {
            // User code from parent
            const userCode = \`${safeCode}\`;

            // Babel Transform
            // We use 'react' preset. We also enable 'env' for modern JS features if needed, 
            // but strict 'react' might be faster/simpler. 
            // Let's use both to ensure standard JS works.
            const output = Babel.transform(userCode, {
              presets: ['react', 'env'],
              filename: 'note.jsx',
            });

            const compiledCode = output.code;

            // Prepare CommonJS-like environment
            const exports = {};
            const module = { exports: {} };
            
            // Mock require (we don't support imports, but just in case user tries)
            const require = (mod) => {
              if (mod === 'react') return React;
              if (mod === 'react-dom') return ReactDOM;
              throw new Error(\`Module '\${mod}' not found. External imports are not supported in this environment.\`);
            };

            // Execute compiled code
            // We wrap in a function to isolate scope and inject dependencies
            const run = new Function('React', 'ReactDOM', 'module', 'exports', 'require', compiledCode);
            run(React, ReactDOM, module, exports, require);

            // Get the default export
            const DefaultComponent = module.exports.default || module.exports;

            if (!DefaultComponent || (typeof DefaultComponent !== 'function' && typeof DefaultComponent !== 'object')) {
              throw new Error("The JSX file must default export a React component.");
            }

            // Render
            const root = ReactDOM.createRoot(document.getElementById('root'));
            // If it's a function component or class component
            root.render(React.createElement(DefaultComponent));

          } catch (err) {
            showError(err);
          }
        </script>
      </body>
      </html>
    `;
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-950">
      <iframe
        ref={iframeRef}
        srcDoc={getIframeContent()}
        title="JSX Preview"
        className="w-full h-full flex-1 border-none"
        sandbox="allow-scripts allow-same-origin allow-modals" // allow-same-origin needed for React to work properly in some cases? 
        // Actually, allow-same-origin allows accessing parent if not careful, but srcDoc is unique origin usually.
        // But for safety, strict sandbox is better. React needs 'allow-scripts'.
        // 'allow-same-origin' is required if we want to use local storage or such, but maybe not needed for basic render.
        // Let's stick to safe defaults.
      />
    </div>
  );
};
