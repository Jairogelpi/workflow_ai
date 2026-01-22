/**
 * FORENSIC AUDIT STREAM HOOK v1.0
 * 
 * Subscribes to the useGraphStore and manages a rolling window of audit logs.
 * Used for real-time transparency in the Extension SidePanel.
 */
import { useEffect, useState } from 'react';
import { useGraphStore } from '../../../src/store/useGraphStore';

export function useAuditStream() {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        // Subscribe to state changes in the GraphStore
        const unsubscribe = useGraphStore.subscribe((state) => {
            // Capture the latest audit record [Hito 4.3]
            const lastAudit = state.lastAuditRecord;
            if (lastAudit) {
                setLogs((prev) => {
                    // Avoid duplicates if the state update is triggered by something else
                    if (prev.length > 0 && prev[0].timestamp === lastAudit.timestamp && prev[0].operation === lastAudit.operation) {
                        return prev;
                    }
                    // Keep the last 50 entries
                    return [lastAudit, ...prev].slice(0, 50);
                });
            }
        });

        return () => unsubscribe();
    }, []);

    return logs;
}
