import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  file: string;
  isDark?: boolean;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ file, isDark }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => Math.min(Math.max(1, prevPageNumber + offset), numPages));
  };

  const changeScale = (delta: number) => {
    setScale((prevScale) => Math.min(Math.max(0.5, prevScale + delta), 3.0));
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-gray-50 text-zinc-900'}`}>
      {/* Toolbar */}
      <div className={`flex items-center justify-between p-2 border-b ${isDark ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-white'}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className={`px-3 py-1 rounded text-sm ${
              pageNumber <= 1
                ? 'opacity-50 cursor-not-allowed'
                : isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'
            }`}
          >
            Previous
          </button>
          <span className="text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className={`px-3 py-1 rounded text-sm ${
              pageNumber >= numPages
                ? 'opacity-50 cursor-not-allowed'
                : isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'
            }`}
          >
            Next
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeScale(-0.1)}
            className={`px-2 py-1 rounded text-sm ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'}`}
          >
            -
          </button>
          <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => changeScale(0.1)}
            className={`px-2 py-1 rounded text-sm ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100'}`}
          >
            +
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto flex justify-center p-4">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          className="shadow-lg"
          loading={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-64 text-red-500">
              Failed to load PDF file.
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className={isDark ? 'dark-pdf-page' : ''}
          />
        </Document>
      </div>
    </div>
  );
};
