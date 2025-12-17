import React from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// Use unpkg for reliable worker loading
const workerUrl = `https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`;

interface PDFViewerProps {
  file: string;
  isDark?: boolean;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ file, isDark }) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div 
      className={`h-full w-full ${isDark ? 'rpv-core__viewer--dark' : ''} overflow-hidden`}
      style={{
        // Ensure the container takes full height
        height: '100%',
      }}
    >
      <Worker workerUrl={workerUrl}>
        <Viewer
          fileUrl={file}
          plugins={[defaultLayoutPluginInstance]}
          theme={isDark ? 'dark' : 'light'}
        />
      </Worker>
    </div>
  );
};
