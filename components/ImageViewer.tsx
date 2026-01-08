import React, { useState, useRef, useEffect } from 'react';

interface ImageViewerProps {
  content: string; // URL
  fileName: string;
  scale?: number;
  onZoomChange?: (scale: number) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ content, fileName, scale = 1, onZoomChange }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset position when content changes
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, [content]);

  // Clamp position helper
  const clampPosition = (x: number, y: number, currentScale: number) => {
    if (!containerRef.current || !imgRef.current) return { x, y };

    const container = containerRef.current;
    const img = imgRef.current;

    // Dimensions
    const cW = container.clientWidth;
    const cH = container.clientHeight;
    
    // Image visual dimensions (at scale=1)
    const iW = img.offsetWidth;
    const iH = img.offsetHeight;

    const scaledW = iW * currentScale;
    const scaledH = iH * currentScale;

    // Calculate bounds
    // If scaled image is smaller than container, center it (x=0, y=0)
    // If larger, allow panning up to the edge
    
    let limitX = 0;
    if (scaledW > cW) {
        limitX = (scaledW - cW) / 2;
    }

    let limitY = 0;
    if (scaledH > cH) {
        limitY = (scaledH - cH) / 2;
    }

    const clampedX = Math.max(-limitX, Math.min(limitX, x));
    const clampedY = Math.max(-limitY, Math.min(limitY, y));

    return { x: clampedX, y: clampedY };
  };

  // Re-clamp when scale changes
  useEffect(() => {
    setPosition(prev => clampPosition(prev.x, prev.y, scale));
  }, [scale]);

  // Re-clamp on window resize
  useEffect(() => {
    const handleResize = () => {
        setPosition(prev => clampPosition(prev.x, prev.y, scale));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scale]);

  const handleWheel = (e: React.WheelEvent) => {
    // Prevent default scroll
    e.preventDefault();
    e.stopPropagation();

    if (onZoomChange) {
      const delta = -e.deltaY;
      // Use smaller steps for wheel
      const step = 0.05;
      const newScale = delta > 0 ? Math.min(scale + step, 5) : Math.max(scale - step, 0.1);
      // Round to 2 decimals to avoid floating point errors
      onZoomChange(Math.round(newScale * 100) / 100);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only left click
    if (e.button !== 0) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const rawX = e.clientX - dragStart.x;
      const rawY = e.clientY - dragStart.y;
      
      // Clamp immediately while dragging
      const clamped = clampPosition(rawX, rawY, scale);
      setPosition(clamped);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 overflow-hidden relative"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <img 
        ref={imgRef}
        src={content} 
        alt={fileName} 
        className="max-w-full max-h-full object-contain shadow-md rounded pointer-events-none select-none"
        style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
        onLoad={() => {
            // Re-check bounds when image loads
            setPosition(prev => clampPosition(prev.x, prev.y, scale));
        }}
      />
    </div>
  );
};
