'use client';

import React, { useState, useEffect, useRef } from 'react';
// Añadimos el icono ExternalLink
import { X, Maximize2, Minimize2, GripHorizontal, ExternalLink } from 'lucide-react';

/**
 * FloatingPanel Component
 * 
 * A draggable, resizable (minimize/maximize) window component that floats above the graph.
 * It provides a "desktop-like" experience for viewing content while maintaining context of the graph.
 * 
 * Features:
 * - Glassmorphism UI (Backdrop Blur)
 * - Draggable Header
 * - Minimize / Maximize / Close controls
 * - "Pop Out" functionality to open content in a new tab/window
 */
interface FloatingPanelProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  /** URL of the content, used for the Pop Out feature */
  contentUrl?: string | undefined;
  /** Callback triggered when the user clicks the "Pop Out" button */
  onPopOut?: () => void;
  children: React.ReactNode;
  /** Initial position of the window {x, y} */
  initialPos?: { x: number; y: number };
}

export function FloatingPanel({
  title,
  isOpen,
  onClose,
  contentUrl, // Nuevo prop
  onPopOut,   // Nuevo prop
  children,
  initialPos = { x: 100, y: 100 }
}: FloatingPanelProps) {
  const [position, setPosition] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    // Evitar arrastre si clicamos botones
    if ((e.target as HTMLElement).closest('button')) return;

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({ x: dragRef.current.initX + dx, y: dragRef.current.initY + dy });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const panelStyle = isMaximized
    ? "fixed inset-4 z-50 w-[calc(100%-2rem)] h-[calc(100%-2rem)]"
    : "fixed z-50 w-[480px] h-[520px]";

  const dragStyle = isMaximized ? {} : { left: position.x, top: position.y };

  return (
    <div
      className={`${panelStyle} flex flex-col glass-panel rounded-3xl overflow-hidden transition-all duration-300 ease-out animate-scale-in`}
      style={dragStyle}
    >
      {/* Header Bar */}
      <div
        className={`h-12 flex items-center justify-between px-4 select-none border-b border-outline-variant/20 dark:border-white/5 bg-surface-container/50 dark:bg-surface-dark-container-high/50 ${!isMaximized ? 'cursor-move' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-3 text-on-surface dark:text-white">
          <GripHorizontal size={16} className="opacity-40" />
          <span className="font-medium text-sm truncate max-w-[200px]">{title}</span>
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
        {children}
      </div>
    </div>
  );
}
