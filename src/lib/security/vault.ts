/**
 * VAULT SYSTEM v1.0
 * 
 * AES-GCM encryption for protecting API Keys in client and server.
 * Ensures BYOK secrets never exist in plain text in persistent storage.
 */
export class Vault {
    private static ALGO = 'AES-GCM';

    /**
     * Cifra una API Key antes de guardarla en el almacenamiento (Supabase/LocalStorage).
     */
    static async encryptKey(key: string, masterSecret: string): Promise<string> {
        const encoder = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector
        const cryptoKey = await this.deriveKey(masterSecret);

        const encrypted = await crypto.subtle.encrypt(
            { name: this.ALGO, iv },
            cryptoKey,
            encoder.encode(key)
        );

        // Return IV + Data as a Base64 string for persistence
        const authTagLength = 16; // Standard AES-GCM auth tag length
        return btoa(JSON.stringify({
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(encrypted))
        }));
    }

    /**
     * Decrypts a key just-in-time for API calls.
     */
    static async decryptKey(encryptedData: string, masterSecret: string): Promise<string> {
        try {
            const { iv, data } = JSON.parse(atob(encryptedData));
            const cryptoKey = await this.deriveKey(masterSecret);

            const decrypted = await crypto.subtle.decrypt(
                { name: this.ALGO, iv: new Uint8Array(iv) },
                cryptoKey,
                new Uint8Array(data)
            );

            return new TextDecoder().decode(decrypted);
        } catch (err) {
            console.error("[VAULT] Decryption failed. Possible invalid master secret.");
            throw new Error("Failed to decrypt API Key. Check your passphrase.");
        }
    }

    /**
     * Derives a cryptographic key from a user-provided passphrase using PBKDF2.
     */
    private static async deriveKey(secret: string): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode('workgraph-os-salt-2026'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: this.ALGO, length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }
}
