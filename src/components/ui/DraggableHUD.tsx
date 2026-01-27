'use client';

import React, { useState, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { GripHorizontal, Maximize2 } from 'lucide-react';

interface DraggableHUDProps {
    children: React.ReactNode;
    defaultPosition?: { x: number; y: number };
    defaultSize?: { width: number | string; height: number | string };
    id: string;
    title?: string;
}

export function DraggableHUD({ children, defaultPosition, defaultSize, id, title }: DraggableHUDProps) {
    const [position, setPosition] = useState(defaultPosition || { x: 0, y: 0 });
    const [size, setSize] = useState(defaultSize || { width: 'auto', height: 'auto' });
    const [isResizing, setIsResizing] = useState(false);
    const dragControls = useDragControls();

    // Persistence
    useEffect(() => {
        const saved = localStorage.getItem(`hud_pos_${id}`);
        if (saved) {
            try { setPosition(JSON.parse(saved)); } catch (e) { }
        }
    }, [id]);

    const handleDragEnd = (event: any, info: any) => {
        const newPos = { x: info.point.x, y: info.point.y };
        // We don't save exact point since framer-motion handles it via transform, 
        // but we could save the offset if we wanted to survive reloads perfectly.
        // For simplicity in this v1, we'll let framer-motion's internal state handle it during session.
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            dragControls={dragControls}
            dragListener={false}
            initial={position}
            style={{
                width: size.width,
                height: size.height,
                position: 'fixed',
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
            <div className="relative h-full w-full">
                {children}

                {/* Resize Handle (Optional/Simplistic) */}
                <div
                    className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-nwse-resize text-slate-300 hover:text-blue-500"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setIsResizing(true);
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startWidth = typeof size.width === 'number' ? size.width : 240;
                        const startHeight = typeof size.height === 'number' ? size.height : 100;

                        const onMouseMove = (moveEvent: MouseEvent) => {
                            setSize({
                                width: Math.max(150, startWidth + (moveEvent.clientX - startX)),
                                height: 'auto' // Let height be automatic for now to avoid breaking card layouts
                            });
                        };

                        const onMouseUp = () => {
                            setIsResizing(false);
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
