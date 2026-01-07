import React, { useEffect, useState, useRef } from 'react';
import { LoadingAnimation } from './LoadingAnimation';

interface TypstRendererProps {
  code: string;
  isDark?: boolean;
}

// Global typst instance
let typstInitialized = false;

declare global {
  interface Window {
    $typst: any;
    $wasm$typst_renderer: string;
    $wasm$typst_compiler: string;
  }
}

export const TypstRenderer: React.FC<TypstRendererProps> = ({ code, isDark }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const renderTypst = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load Typst from CDN if not already loaded
        if (!typstInitialized) {
          // Set WASM module paths
          window.$wasm$typst_renderer = 'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-renderer@0.5.0-rc5/pkg/typst_ts_renderer_bg.wasm';
          window.$wasm$typst_compiler = 'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler@0.5.0-rc5/pkg/typst_ts_web_compiler_bg.wasm';
          
          // Load the all-in-one-lite bundle from CDN
          const script = document.createElement('script');
          script.type = 'module';
          script.textContent = `
            import * as typst from 'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst.ts@0.5.0-rc5/dist/esm/contrib/all-in-one-lite.bundle.js';
            
            // Configure WASM module paths
            typst.$typst.setCompilerInitOptions({
              getModule: () => window.$wasm$typst_compiler,
            });
            typst.$typst.setRendererInitOptions({
              getModule: () => window.$wasm$typst_renderer,
            });
            
            window.$typst = typst.$typst;
          `;
          document.head.appendChild(script);
          
          // Wait for the script to load
          await new Promise((resolve) => {
            const checkInterval = setInterval(() => {
              if (window.$typst) {
                clearInterval(checkInterval);
                typstInitialized = true;
                resolve(true);
              }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
              clearInterval(checkInterval);
              resolve(false);
            }, 10000);
          });
        }

        if (!window.$typst) {
          throw new Error('Failed to load Typst compiler');
        }

        // Render the typst code to SVG
        const svg = await window.$typst.svg({
          mainContent: code,
        });
        
        // Clean up any global style tags that might be injected
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = svg;
        
        // Remove any <style> tags from the SVG to prevent global style pollution
        const styleTags = tempDiv.querySelectorAll('style');
        styleTags.forEach(style => {
          // Keep the style but scope it to the SVG
          const content = style.textContent || '';
          if (content) {
            // Prefix all selectors with .typst-content to scope them
            const scopedContent = content.replace(
              /([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g,
              '.typst-content $1$2'
            );
            style.textContent = scopedContent;
          }
        });
        
        // Add font-family fallback for Chinese characters
        const svgElements = tempDiv.querySelectorAll('svg');
        svgElements.forEach(svgEl => {
          const existingStyle = svgEl.getAttribute('style') || '';
          svgEl.setAttribute('style', existingStyle + '; font-family: "Times New Roman", "SimSun", "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif;');
        });
        
        const cleanedSvg = tempDiv.innerHTML;
        
        if (mounted) {
          setSvgContent(cleanedSvg);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Typst render error:", err);
        if (mounted) {
          setError(err.message || "Failed to render Typst document");
          setLoading(false);
        }
      }
    };

    renderTypst();

    return () => {
      mounted = false;
    };
  }, [code]);

  return (
    <div className={`w-full h-full overflow-auto p-4 ${!loading && !error ? 'bg-white text-black' : ''}`}>
      {loading && (
        <div className="flex justify-center items-center h-full">
          <LoadingAnimation />
          <span className="ml-2 text-gray-500">Rendering Typst...</span>
        </div>
      )}
      
      {error && (
        <div className="text-red-500 p-4 border border-red-300 rounded bg-red-50">
          <h3 className="font-bold">Rendering Error</h3>
          <pre className="whitespace-pre-wrap text-sm mt-2">{error}</pre>
        </div>
      )}

      {!loading && !error && (
        <div 
          ref={containerRef}
          className="typst-content flex justify-center"
          style={{
            width: '100%',
            height: 'auto',
            isolation: 'isolate',
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: svgContent }} />
        </div>
      )}
    </div>
  );
};
