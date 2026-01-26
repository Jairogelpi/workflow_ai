'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { uploadFile, digestFile } from '../../lib/ingest';
import { useGraphStore } from '../../store/useGraphStore';

interface GlobalDropzoneProps {
    children: React.ReactNode;
}

export default function GlobalDropzone({ children }: GlobalDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'digesting' | 'success' | 'error'>('idle');
    const [lastFile, setLastFile] = useState('');

    // Global drag/drop block - prevents browser from opening PDFs if drop misses target
    useEffect(() => {
        const preventDefault = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
        };
        window.addEventListener('dragover', preventDefault);
        window.addEventListener('drop', preventDefault);
        return () => {
            window.removeEventListener('dragover', preventDefault);
            window.removeEventListener('drop', preventDefault);
        };
    }, []);

    const onDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.relatedTarget || (e.relatedTarget as HTMLElement).id === 'app-root') {
            setIsDragging(false);
        }
    }, []);

    const onDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const projectId = useGraphStore.getState().projectManifest?.id;
        if (!projectId) {
            console.error('No project context found for ingestion.');
            return;
        }

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        setIsUploading(true);
        // setStatus('idle'); // This line is removed/changed implicitly by the new flow
        let successCount = 0;

        try {
            for (const file of files) {
                setLastFile(file.name);

                // Stage 1: Upload
                setStatus('uploading');
                const uploadResult = await uploadFile(file, file.name, projectId);

                // Stage 2: Digest (if not deduplicated)
                if (!uploadResult.deduplicated) {
                    setStatus('digesting');
                    await digestFile(uploadResult.nodeId, file, projectId);
                }

                successCount++;
            }
            setStatus('success');
            setLastFile(`Successfully ingested ${successCount} source${successCount > 1 ? 's' : ''}`);
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error) {
            console.error('Ingest UI Error:', error);
            setStatus('error');
            setLastFile('Some files failed to ingest. Check console.');
        } finally {
            setIsUploading(false);
        }
    }, []);

    return (
        <div
            id="app-root"
            className="relative w-screen h-screen overflow-hidden"
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {children}

            {/* Dropzone Overlay */}
            {isDragging && !isUploading && (
                <div className="absolute inset-4 z-[9999] bg-primary/5 dark:bg-primary-dark/10 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-primary dark:border-primary-dark rounded-4xl pointer-events-none animate-scale-in">
                    <div className="w-20 h-20 rounded-full bg-primary/10 dark:bg-primary-dark/20 flex items-center justify-center mb-6 animate-float">
                        <Upload className="w-10 h-10 text-primary dark:text-primary-dark" />
                    </div>
                    <h2 className="text-2xl font-bold text-on-surface dark:text-white tracking-tight">Drop to Ingest</h2>
                    <p className="text-outline dark:text-outline-variant mt-2">Add to WorkGraph Knowledge Base</p>
                </div>
            )}

            {/* Uploading / Status Toast */}
            {(isUploading || status !== 'idle') && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[110] animate-slide-up">
                    <div className="glass-panel rounded-2xl px-5 py-4 min-w-[280px] flex items-center gap-4">
                        {isUploading ? (
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Loader2 className="text-primary animate-spin" size={20} />
                            </div>
                        ) : status === 'success' ? (
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <Check className="text-green-600 dark:text-green-400" size={20} />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <AlertCircle className="text-red-500" size={20} />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-on-surface dark:text-white">
                                {status === 'success' ? 'Knowledge Digested!' :
                                    status === 'error' ? 'Import Failed' :
                                        status === 'digesting' ? 'Digesting...' : 'Ingesting...'}
                            </p>
                            <p className="text-xs text-outline dark:text-outline-variant truncate mt-0.5">
                                {lastFile}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
