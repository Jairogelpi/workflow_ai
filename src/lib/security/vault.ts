/**
 * WorkGraph Secure Vault (BYOK)
 * Client-side encryption for model provider keys.
 * Uses AES-GCM (Web Crypto API) for local storage encryption.
 */

const VAULT_STORAGE_KEY = 'wg_vault_data';
const SALT_SIZE = 16;
const IV_SIZE = 12;

interface VaultData {
    [provider: string]: string; // provider -> encrypted key
}

/**
 * Derives a cryptographic key from a master password (human input).
 * If no password is provided, we use a machine-specific fallback (less secure but seamless).
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: 100000,
            hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

export class KeyVault {
    private static async getEncryptionContext(password: string) {
        let salt: Uint8Array;
        let iv: Uint8Array;

        const stored = localStorage.getItem(VAULT_STORAGE_KEY + '_meta');
        if (stored) {
            const { s, i } = JSON.parse(stored);
            salt = new Uint8Array(Object.values(s));
            iv = new Uint8Array(Object.values(i));
        } else {
            salt = window.crypto.getRandomValues(new Uint8Array(SALT_SIZE));
            iv = window.crypto.getRandomValues(new Uint8Array(IV_SIZE));
            localStorage.setItem(VAULT_STORAGE_KEY + '_meta', JSON.stringify({ s: Array.from(salt), i: Array.from(iv) }));
        }

        const key = await deriveKey(password, salt);
        return { key, iv };
    }

    static async setKey(provider: string, apiKey: string, masterPassword: string = 'wg-default-seal') {
        const { key, iv } = await this.getEncryptionContext(masterPassword);
        const encoder = new TextEncoder();

        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv as BufferSource },
            key,
            encoder.encode(apiKey)
        );

        const currentVault = this.getRawVault();
        currentVault[provider] = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
        localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(currentVault));
    }

    static async getKey(provider: string, masterPassword: string = 'wg-default-seal'): Promise<string | null> {
        const vault = this.getRawVault();
        const encryptedStr = vault[provider];
        if (!encryptedStr) return null;

        const { key, iv } = await this.getEncryptionContext(masterPassword);
        const encryptedData = new Uint8Array(atob(encryptedStr).split('').map(char => char.charCodeAt(0)));

        try {
            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv as BufferSource },
                key,
                encryptedData as BufferSource
            );
            return new TextDecoder().decode(decrypted);
        } catch (e) {
            console.error('[Vault] Decryption failed. Incorrect password?', e);
            return null;
        }
    }

    private static getRawVault(): VaultData {
        const data = localStorage.getItem(VAULT_STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    }

    static clearVault() {
        localStorage.removeItem(VAULT_STORAGE_KEY);
        localStorage.removeItem(VAULT_STORAGE_KEY + '_meta');
    }
}
