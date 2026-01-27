'use client';

import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { GripHorizontal, Maximize2 } from 'lucide-react';
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
    const dragControls = useDragControls();

    const storageKey = `hud_${projectId}_${id}`;

    // Load Persistence
    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const { pos, sz } = JSON.parse(saved);
                if (pos) setPosition(pos);
                if (sz) setSize(sz);
            } catch (e) { }
        } else {
            // Respect defaults if no saved state
            if (defaultPosition) setPosition(defaultPosition);
            if (defaultSize) setSize(defaultSize);
        }
    }, [storageKey, defaultPosition, defaultSize]);

    const saveState = (pos: any, sz: any) => {
        localStorage.setItem(storageKey, JSON.stringify({ pos, sz }));
    };

    const handleDragEnd = (event: any, info: any) => {
        const newPos = { x: position.x + info.offset.x, y: position.y + info.offset.y };
        setPosition(newPos);
        saveState(newPos, size);
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragControls={dragControls}
            dragListener={false}
            onDragEnd={handleDragEnd}
            initial={false}
            animate={{ x: position.x, y: position.y }}
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
            {/* Drag Handle */}
            <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 rounded-full px-2 py-1 cursor-grab active:cursor-grabbing shadow-sm flex items-center gap-1 z-20"
                onPointerDown={(e) => dragControls.start(e)}
            >
                <GripHorizontal size={12} className="text-slate-400" />
                {title && <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{title}</span>}
            </div>

            {/* Content Wrapper */}
            <div className={`relative h-full w-full ${isResizing ? 'pointer-events-none' : ''}`}>
                {children}

                {/* Resize Handle */}
                <div
                    className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-nwse-resize text-slate-300 hover:text-blue-500 z-30"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setIsResizing(true);
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startWidth = (e.currentTarget.parentElement?.clientWidth || 0);
                        const startHeight = (e.currentTarget.parentElement?.clientHeight || 0);

                        const onMouseMove = (moveEvent: MouseEvent) => {
                            const newSize = {
                                width: Math.max(100, startWidth + (moveEvent.clientX - startX)),
                                height: Math.max(40, startHeight + (moveEvent.clientY - startY))
                            };
                            setSize(newSize);
                        };

                        const onMouseUp = (upEvent: MouseEvent) => {
                            setIsResizing(false);
                            const finalSize = {
                                width: Math.max(100, startWidth + (upEvent.clientX - startX)),
                                height: Math.max(40, startHeight + (upEvent.clientY - startY))
                            };
                            saveState(position, finalSize);
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                        };

                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                    }}
                >
                    <Maximize2 size={10} className="rotate-90" />
                </div>
            </div>
        </motion.div>
    );
}
