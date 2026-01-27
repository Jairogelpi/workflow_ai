'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, GripHorizontal, ExternalLink, FileText, Upload } from 'lucide-react';

/**
 * FloatingPanel Component
 * 
 * Enhanced with universal drag & drop support:
 * - Text selections from anywhere on the web
 * - Local files from file system
 * - Files from cloud interfaces
 */
interface FloatingPanelProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  contentUrl?: string | undefined;
  onPopOut?: () => void;
  onTextDrop?: (text: string, sourceUrl?: string) => void;
  onFileDrop?: (files: FileList) => void;
  children: React.ReactNode;
  initialPos?: { x: number; y: number };
}

export function FloatingPanel({
  title,
  isOpen,
  onClose,
  contentUrl,
  onPopOut,
  onTextDrop,
  onFileDrop,
  children,
  initialPos = { x: 100, y: 100 }
}: FloatingPanelProps) {
  const [position, setPosition] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [dropState, setDropState] = useState<'idle' | 'text' | 'file'>('idle');
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y
    };
  };

  // Resizing state
  const [size, setSize] = useState({ w: 480, h: 520 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  // Dragging logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Handle Drag
      if (isDragging && dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPosition({ x: dragRef.current.initX + dx, y: dragRef.current.initY + dy });
      }

      // Handle Resize
      if (isResizing && resizeRef.current) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        setSize({
          w: Math.max(300, resizeRef.current.startW + dx),
          h: Math.max(200, resizeRef.current.startH + dy)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: size.w,
      startH: size.h
    };
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Detect what's being dragged
    const hasFiles = e.dataTransfer.types.includes('Files');
    const hasText = e.dataTransfer.types.includes('text/plain') || e.dataTransfer.types.includes('text/html');

    if (hasFiles) {
      setDropState('file');
    } else if (hasText) {
      setDropState('text');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only reset if leaving the panel entirely
    if (e.currentTarget === e.target) {
      setDropState('idle');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Handle files
    if (e.dataTransfer.files.length > 0) {
      if (onFileDrop) {
        onFileDrop(e.dataTransfer.files);
      }
    }
    // Handle text
    else if (e.dataTransfer.types.includes('text/plain')) {
      const text = e.dataTransfer.getData('text/plain');
      const sourceUrl = e.dataTransfer.getData('text/uri-list') || window.location.href;

      if (onTextDrop && text) {
        onTextDrop(text, sourceUrl);
      }
    }

    setDropState('idle');
  };

  const panelStyle = isMaximized
    ? "fixed inset-4 z-50 w-[calc(100%-2rem)] h-[calc(100%-2rem)]"
    : "fixed z-50";

  const dynamicStyle = isMaximized
    ? {}
    : { left: position.x, top: position.y, width: size.w, height: size.h };

  return (
    <div
      className={`${panelStyle} flex flex-col bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.15)] rounded-[24px] overflow-hidden transition-shadow duration-300 animate-scale-in ${dropState !== 'idle' ? 'ring-4 ring-blue-500/20 ring-offset-0' : ''
        }`}
      style={dynamicStyle}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header Bar - Gemini Style (Clean, Minimal) */}
      <div
        className={`h-14 flex items-center justify-between px-6 select-none border-b border-slate-100/50 ${!isMaximized ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3 text-slate-800">
          <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full opacity-80" />
          <span className="font-semibold text-sm tracking-tight text-slate-700 font-sans">{title}</span>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1">
          {onPopOut && contentUrl && (
            <button
              onClick={onPopOut}
              title="Open in new Tab"
              className="p-2 hover:bg-primary/10 rounded-xl text-outline dark:text-outline-variant hover:text-primary transition-all"
            >
              <ExternalLink size={16} />
            </button>
          )}

          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-2 hover:bg-primary/10 rounded-xl text-outline dark:text-outline-variant hover:text-primary transition-all"
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button
            onClick={onClose}
            className="p-2 hover:bg-red-500/10 rounded-xl text-outline dark:text-outline-variant hover:text-red-500 transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-surface dark:bg-surface-dark-container">
        {dropState !== 'idle' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/5 backdrop-blur-sm pointer-events-none">
            <div className="flex flex-col items-center gap-3 text-primary">
              {dropState === 'file' ? (
                <>
                  <Upload size={48} className="animate-bounce" />
                  <p className="text-lg font-medium">Drop files here</p>
                </>
              ) : (
                <>
                  <FileText size={48} className="animate-bounce" />
                  <p className="text-lg font-medium">Drop text to create node</p>
                </>
              )}
            </div>
          </div>
        )}
        {children}
      </div>

      {/* Resize Handle */}
      {!isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 hover:bg-slate-100 rounded-tl-xl flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeStart}
        >
          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
        </div>
      )}
    </div>
  );
}
