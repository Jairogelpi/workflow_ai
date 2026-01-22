'use client';

import React, { useState, useEffect, useRef } from 'react';
// Añadimos el icono ExternalLink
import { X, Maximize2, Minimize2, GripHorizontal, ExternalLink } from 'lucide-react';

interface FloatingPanelProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  // Añadimos prop para la URL y la función de pop-out
  contentUrl?: string;
  onPopOut?: () => void;
  children: React.ReactNode;
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
    : "fixed z-50 w-[600px] h-[500px]";

  const dragStyle = isMaximized ? {} : { left: position.x, top: position.y };

  return (
    <div
      className={`${panelStyle} flex flex-col bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 ease-out animate-in fade-in zoom-in-95`}
      style={dragStyle}
    >
      {/* Header Bar */}
      <div
        className={`h-10 bg-white/5 flex items-center justify-between px-3 select-none border-b border-white/5 ${!isMaximized ? 'cursor-move' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-slate-300 font-mono text-xs tracking-wide group">
          <GripHorizontal size={14} className="opacity-50 group-hover:text-white transition-colors" />
          <span className="truncate max-w-[250px] uppercase">{title}</span>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1">
          {/* BOTÓN POP-OUT (NUEVO) */}
          {onPopOut && contentUrl && (
            <button
              onClick={onPopOut}
              title="Open in new Tab (Pop Out)"
              className="p-1.5 hover:bg-indigo-500/20 rounded-md text-slate-400 hover:text-indigo-400 transition-colors mr-2 border-r border-white/10 pr-2"
            >
              <ExternalLink size={14} />
            </button>
          )}

          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-cyan-400 transition-colors"
          >
            {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-500/20 rounded-md text-slate-400 hover:text-red-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-slate-950/50">
        {children}
      </div>
    </div>
  );
}
