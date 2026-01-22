/**
 * WorkGraph Rate Limiter
 * Manages API limits per user and model provider.
 */

import { createClient } from '../../lib/supabase';

interface RateLimitConfig {
    maxRequests: number;
    windowSeconds: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    maxRequests: 50,
    windowSeconds: 3600 // 50 requests per hour by default
};

export class RateLimiter {
    /**
     * Checks if a user has exceeded their rate limit.
     * Uses a simple Redis-style window in Supabase or LocalCache for now.
     */
    static async checkLimit(userId: string, provider: string): Promise<{ allowed: boolean; remaining: number }> {
        const supabase = await createClient();
        const now = new Date();
        const windowStart = new Date(now.getTime() - DEFAULT_CONFIG.windowSeconds * 1000).toISOString();

        // Count requests in the current window for this user
        const { count, error } = await supabase
            .from('api_usage_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('provider', provider)
            .gt('created_at', windowStart);

        if (error) {
            console.error('[RateLimiter] Error checking limit:', error);
            return { allowed: true, remaining: 1 }; // Fail open for safety, but log
        }

        const currentCount = count || 0;
        const allowed = currentCount < DEFAULT_CONFIG.maxRequests;

        return {
            allowed,
            remaining: Math.max(0, DEFAULT_CONFIG.maxRequests - currentCount)
        };
    }

    /**
     * Records a request in the usage log.
     */
    static async recordRequest(userId: string, provider: string, tokens: number = 0) {
        const supabase = await createClient();
        await supabase.from('api_usage_logs').insert({
            user_id: userId,
            provider,
            tokens_used: tokens,
            created_at: new Date().toISOString()
        });
    }
}
