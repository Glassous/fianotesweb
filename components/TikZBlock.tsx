import React, { useEffect, useRef, useState } from "react";

interface TikZBlockProps {
  code: string;
}

export const TikZBlock: React.FC<TikZBlockProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    // Clean TikZ code: remove problematic decorations and options
    let cleanedTikz = code
      // Remove document class and preamble commands
      .replace(/\\documentclass(\[.*?\])?\{.*?\}/g, '')
      .replace(/\\usepackage(\[.*?\])?\{.*?\}/g, '')
      .replace(/\\usetikzlibrary\{.*?\}/g, '')
      .replace(/\\begin\{document\}/g, '')
      .replace(/\\end\{document\}/g, '')
      // Remove problematic decorations
      .replace(/\.expanded/g, '')
      .replace(/,?\s*decoration=\{[^}]*\}/g, '')
      .replace(/,?\s*decoration=[a-zA-Z]+/g, '')
      .replace(/,?\s*decorate\s*(?=[\],])/g, '')
      .replace(/,\s*,/g, ',')
      .replace(/\[\s*,/g, '[')
      .replace(/,\s*\]/g, ']')
      .trim();

    // Ensure we have tikzpicture environment
    if (!cleanedTikz.includes('\\begin{tikzpicture}')) {
      cleanedTikz = `\\begin{tikzpicture}\n${cleanedTikz}\n\\end{tikzpicture}`;
    }

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
            background: transparent;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
          }
          svg {
            display: block;
            margin: 0 auto;
            max-width: 100%;
            height: auto;
          }
          .tikzjax-console {
            display: none !important;
          }
        </style>
        <link rel="stylesheet" type="text/css" href="https://tikzjax.com/v1/fonts.css">
        <script src="https://tikzjax.com/v1/tikzjax.js"><\/script>
        <script>
          // Polyfill btoa to handle Unicode characters
          (function() {
            const originalBtoa = window.btoa;
            window.btoa = function(str) {
              try {
                return originalBtoa(str);
              } catch (e) {
                return originalBtoa(unescape(encodeURIComponent(str)));
              }
            };
            
            const originalAtob = window.atob;
            window.atob = function(str) {
              try {
                const decoded = originalAtob(str);
                return decodeURIComponent(escape(decoded));
              } catch (e) {
                return originalAtob(str);
              }
            };
          })();

          // Suppress error messages
          window.addEventListener('error', function(e) {
            e.preventDefault();
            return true;
          }, true);

          console.error = function() {};
          console.warn = function() {};

          // Send height to parent when SVG is rendered
          function updateHeight() {
            const svg = document.querySelector('svg');
            if (svg) {
              const height = svg.getBoundingClientRect().height + 40; // 40px for padding
              window.parent.postMessage({ type: 'TIKZ_HEIGHT', height: height }, '*');
            }
          }

          // Check for SVG periodically
          const checkInterval = setInterval(() => {
            const svg = document.querySelector('svg');
            if (svg) {
              clearInterval(checkInterval);
              setTimeout(updateHeight, 100);
            }
          }, 100);
        <\/script>
      </head>
      <body>
        <script type="text/tikz">${cleanedTikz}</script>
      </body>
      </html>
    `;

    // Create iframe for isolated rendering
    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "200px"; // Initial height
    iframe.style.border = "none";
    iframe.style.backgroundColor = "transparent";
    iframe.srcdoc = htmlContent;
    
    container.appendChild(iframe);

    // Listen for height updates from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TIKZ_HEIGHT' && event.data.height) {
        const newHeight = event.data.height;
        iframe.style.height = `${newHeight}px`;
      }
    };
    window.addEventListener('message', handleMessage);

    // Wait for TikZJax to load and render
    const checkRendering = setInterval(() => {
      const win = iframe.contentWindow as any;
      if (!win) return;
      
      const tikzReady = win.tex !== undefined;
      
      if (tikzReady) {
        clearInterval(checkRendering);
      }
    }, 150);

    // Cleanup timeout after 15 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkRendering);
    }, 15000);

    return () => {
      clearInterval(checkRendering);
      clearTimeout(timeout);
      window.removeEventListener('message', handleMessage);
    };
  }, [code]);

  return (
    <div className="my-6 flex justify-center">
      <div ref={containerRef} className="w-full" />
    </div>
  );
};
