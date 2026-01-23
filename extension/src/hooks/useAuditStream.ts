/**
 * FORENSIC AUDIT STREAM HOOK v1.1 (Decoupled)
 * 
 * Manages a local rolling window of audit logs for the Extension.
 * In a real scenario, this would listen to chrome.runtime messages from the ingestion process.
 */
import { useEffect, useState } from 'react';

export function useAuditStream() {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        // Listen for internal capture/ingestion events from the extension itself
        const listener = (msg: any) => {
            if (msg.type === 'AUDIT_LOG') {
                setLogs((prev) => [msg.data, ...prev].slice(0, 50));
            }
        };

        chrome.runtime.onMessage.addListener(listener);
        return () => chrome.runtime.onMessage.removeListener(listener);
    }, []);

    return logs;
}
