'use client';

import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { GripHorizontal, Maximize2, RotateCcw } from 'lucide-react';
import { useGraphStore } from '../../store/useGraphStore';

interface DraggableHUDProps {
    children: React.ReactNode;
    defaultPosition?: { x: number; y: number };
    defaultSize?: { width: number | string; height: number | string };
    id: string;
    title?: string;
}

export function DraggableHUD({ children, defaultPosition, defaultSize, id, title }: DraggableHUDProps) {
    const projectManifest = useGraphStore(state => state.projectManifest);
    const projectId = projectManifest?.id || 'global';

    const [position, setPosition] = useState(defaultPosition || { x: 0, y: 0 });
    const [size, setSize] = useState(defaultSize || { width: 'auto', height: 'auto' });
    const [isResizing, setIsResizing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragControls = useDragControls();

    const storageKey = `hud_${projectId}_${id}`;

    // Viewport Clamping Helper
    const clampPosition = (pos: { x: number; y: number }, sz: { width: any, height: any }) => {
        if (typeof window === 'undefined') return pos;

        const w = typeof sz.width === 'number' ? sz.width : 300;
        const h = typeof sz.height === 'number' ? sz.height : 200;

        return {
            x: Math.min(Math.max(0, pos.x), window.innerWidth - w),
            y: Math.min(Math.max(0, pos.y), window.innerHeight - h)
        };
    };

    // Load Persistence & Re-clamp on window resize
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        let currentPos = defaultPosition || { x: 0, y: 0 };
        let currentSize = defaultSize || { width: 'auto', height: 'auto' };

        if (saved) {
            try {
                const { pos, sz } = JSON.parse(saved);
                if (pos) currentPos = pos;
                if (sz) currentSize = sz;
            } catch (e) { }
        }

        const initialClamped = clampPosition(currentPos, currentSize);
        setPosition(initialClamped);
        setSize(currentSize);

        const handleResize = () => {
            setPosition(prev => clampPosition(prev, currentSize));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [storageKey, defaultPosition, defaultSize]);

    const saveState = (pos: any, sz: any) => {
        const clamped = clampPosition(pos, sz);
        localStorage.setItem(storageKey, JSON.stringify({ pos: clamped, sz }));
    };

    const handleReset = (e: React.MouseEvent) => {
        e.stopPropagation();
        const pos = defaultPosition || { x: 0, y: 0 };
        const sz = defaultSize || { width: 'auto', height: 'auto' };
        setPosition(pos);
        setSize(sz);
        localStorage.removeItem(storageKey);
    };

    const handleDragStart = () => setIsDragging(true);
    const handleDragEnd = (event: any, info: any) => {
        setIsDragging(false);
        const newPos = clampPosition({
            x: position.x + info.offset.x,
            y: position.y + info.offset.y
        }, size);
        setPosition(newPos);
        saveState(newPos, size);
    };

    const startResizing = (e: React.MouseEvent, type: 'br' | 'bl' | 'tr' | 'tl') => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = (e.currentTarget.parentElement?.clientWidth || 0);
        const startHeight = (e.currentTarget.parentElement?.clientHeight || 0);
        const startPosX = position.x;
        const startPosY = position.y;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;
            let newPos = { x: startPosX, y: startPosY };

            if (type === 'br') {
                newWidth = Math.min(window.innerWidth - startPosX, Math.max(100, startWidth + deltaX));
                newHeight = Math.min(window.innerHeight - startPosY, Math.max(40, startHeight + deltaY));
            } else if (type === 'bl') {
                newWidth = Math.min(startPosX + startWidth, Math.max(100, startWidth - deltaX));
                newHeight = Math.min(window.innerHeight - startPosY, Math.max(40, startHeight + deltaY));
                newPos.x = startPosX + (startWidth - newWidth);
            } else if (type === 'tr') {
                newWidth = Math.min(window.innerWidth - startPosX, Math.max(100, startWidth + deltaX));
                newHeight = Math.min(startPosY + startHeight, Math.max(40, startHeight - deltaY));
                newPos.y = startPosY + (startHeight - newHeight);
            } else if (type === 'tl') {
                newWidth = Math.min(startPosX + startWidth, Math.max(100, startWidth - deltaX));
                newHeight = Math.min(startPosY + startHeight, Math.max(40, startHeight - deltaY));
                newPos.x = startPosX + (startWidth - newWidth);
                newPos.y = startPosY + (startHeight - newHeight);
            }

            setSize({ width: newWidth, height: newHeight });
            setPosition(newPos);
        };

        const onMouseUp = () => {
            setIsResizing(false);
            saveState(position, size);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragControls={dragControls}
            dragListener={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            initial={false}
            animate={{
                x: position.x,
                y: position.y,
                scale: (isDragging || isResizing) ? 1.02 : 1,
                boxShadow: (isDragging || isResizing)
                    ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                    : "0 0px 0px 0px rgba(0, 0, 0, 0)"
            }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                boxShadow: { duration: 0.2 }
            }}
            style={{
                width: size.width,
                height: size.height,
                minWidth: 'fit-content',
                minHeight: 'fit-content',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 60
            }}
            className="group pointer-events-auto"
        >
            {/* Drag Handle & Reset */}
            <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 rounded-full px-2 py-1 shadow-sm flex items-center gap-2 z-20"
            >
                <div
                    className="cursor-grab active:cursor-grabbing flex items-center gap-1"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <GripHorizontal size={12} className="text-slate-400" />
                    {title && <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{title}</span>}
                </div>
                <div className="w-px h-3 bg-slate-100" />
                <button
                    onClick={handleReset}
                    className="p-0.5 hover:bg-slate-50 rounded text-slate-400 hover:text-blue-500 transition-colors"
                >
                    <RotateCcw size={10} />
                </button>
            </div>

            {/* Content Wrapper */}
            <div className={`relative h-full w-full ${isResizing ? 'pointer-events-none select-none' : ''} bg-white rounded-2xl border border-slate-200 overflow-hidden`}>
                {children}

                {/* Resize Handles (4 corners) */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Top Left */}
                    <div
                        className="absolute -top-1 -left-1 w-4 h-4 cursor-nw-resize pointer-events-auto z-30"
                        onMouseDown={(e) => startResizing(e, 'tl')}
                    />
                    {/* Top Right */}
                    <div
                        className="absolute -top-1 -right-1 w-4 h-4 cursor-ne-resize pointer-events-auto z-30"
                        onMouseDown={(e) => startResizing(e, 'tr')}
                    />
                    {/* Bottom Left */}
                    <div
                        className="absolute -bottom-1 -left-1 w-4 h-4 cursor-sw-resize pointer-events-auto z-30"
                        onMouseDown={(e) => startResizing(e, 'bl')}
                    />
                    {/* Bottom Right */}
                    <div
                        className="absolute -bottom-1 -right-1 w-4 h-4 cursor-se-resize pointer-events-auto z-30 flex items-center justify-center"
                        onMouseDown={(e) => startResizing(e, 'br')}
                    >
                        <Maximize2 size={8} className="rotate-90 text-slate-300" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
