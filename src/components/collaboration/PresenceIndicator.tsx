import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import { Users } from 'lucide-react';

interface PresenceProps {
    nodeId: string;
    currentUser: { id: string; username: string };
}

/**
 * Gate 9: PresenceIndicator
 * Visualizes active collaborators on a specific node using Supabase Realtime.
 */
export const PresenceIndicator: React.FC<PresenceProps> = ({ nodeId, currentUser }) => {
    const [activeUsers, setActiveUsers] = useState<string[]>([]);

    useEffect(() => {
        const initPresence = async () => {
            const supabase = await createClient();

            // Channel specific for this node
            const channel = supabase.channel(`node_presence:${nodeId}`, {
                config: {
                    presence: {
                        key: currentUser.id,
                    },
                },
            });

            channel
                .on('presence', { event: 'sync' }, () => {
                    const newState = channel.presenceState();
                    const usernames = Object.values(newState)
                        .flat()
                        .map((p: any) => p.username)
                        .filter(name => name !== currentUser.username);

                    setActiveUsers(usernames);
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.track({
                            username: currentUser.username,
                            online_at: new Date().toISOString(),
                        });
                    }
                });

            return () => {
                supabase.removeChannel(channel);
            };
        };

        const cleanupPromise = initPresence();
        return () => {
            cleanupPromise.then(cleanup => {
                if (typeof cleanup === 'function') cleanup();
            });
        };
    }, [nodeId, currentUser]);

    if (activeUsers.length === 0) return null;

    return (
        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 animate-in fade-in slide-in-from-top-1">
            <Users className="h-3.5 w-3.5" />
            <span>{activeUsers.length} editing: {activeUsers.join(', ')}</span>
        </div>
    );
};
