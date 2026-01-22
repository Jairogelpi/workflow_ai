'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { uploadFile, digestFile } from '../../lib/ingest';

interface GlobalDropzoneProps {
    children: React.ReactNode;
}

export default function GlobalDropzone({ children }: GlobalDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'digesting' | 'success' | 'error'>('idle');
    const [lastFile, setLastFile] = useState('');

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only trigger if we actually left the window or the main overlay
        if (e.relatedTarget === null) {
            setIsDragging(false);
        }
    }, []);

    const onDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

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
                const uploadResult = await uploadFile(file, file.name);

                // Stage 2: Digest (if not deduplicated)
                if (!uploadResult.deduplicated) {
                    setStatus('digesting');
                    await digestFile(uploadResult.nodeId, file);
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
            className="relative w-full h-full"
            onDragOver={onDragOver}
        >
            {children}

            {/* Dropzone Overlay */}
            {isDragging && !isUploading && (
                <div
                    className="absolute inset-0 z-[100] bg-blue-600/20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-blue-500 animate-pulse"
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                >
                    <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
                            <Upload className="text-white" size={32} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Drop to Ingest</h2>
                            <p className="text-slate-400 text-sm">Release to aggregate these files into your WorkGraph</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Uploading / Status Modal */}
            {(isUploading || status !== 'idle') && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[110] animate-in fade-in slide-in-from-top-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-4 min-w-[300px] flex items-center gap-4">
                        {isUploading ? (
                            <Loader2 className="text-blue-500 animate-spin" size={20} />
                        ) : status === 'success' ? (
                            <div className="flex flex-col items-center gap-1 text-white text-center">
                                <div className="relative">
                                    <Upload className="w-10 h-10" />
                                    <div className="absolute -right-2 -bottom-2 bg-green-500 rounded-full p-1">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                </div>
                                <h2 className="text-lg font-bold">Knowledge Digested!</h2>
                                <p className="text-xs text-slate-400 max-w-[200px] truncate">
                                    {lastFile}
                                </p>
                            </div>
                        ) : (
                            <AlertCircle className="text-red-500" size={20} />
                        )}

                        {(isUploading || status === 'uploading' || status === 'digesting') && (
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-200">
                                    {status === 'digesting' ? 'Digesting Knowledge...' : 'Ingesting...'}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                                    {lastFile}
                                </p>
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-200">Failed</p>
                                <p className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                                    {lastFile}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
