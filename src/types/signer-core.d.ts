declare module 'signer-core' {
    /**
     * Generates a new Ed25519 keypair for node signing.
     * @returns JSON string: { private_key: base64, public_key: base64 }
     */
    export function generate_keypair(): string;

    /**
     * Signs a node hash with the user's private key.
     * @param node_hash - The SHA-256 hash of the node content.
     * @param private_key_base64 - The user's private key in Base64.
     * @returns JSON SignatureResult: { signature, public_key, node_hash, timestamp }
     */
    export function sign_node(node_hash: string, private_key_base64: string): string;

    /**
     * Verifies a node signature against the stored public key.
     * @param node_hash - The SHA-256 hash of the node content.
     * @param signature_base64 - The signature to verify.
     * @param public_key_base64 - The signer's public key.
     * @returns JSON VerificationResult: { valid, node_hash, signer_public_key }
     */
    export function verify_signature(node_hash: string, signature_base64: string, public_key_base64: string): string;

    export default function init(): Promise<void>;
}
