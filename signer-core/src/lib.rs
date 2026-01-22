/**
 * AUTHORITY SIGNER v1.0
 * 
 * Ed25519 cryptographic signatures for WorkGraph nodes.
 * Ensures human authorship is 100% verifiable and immutable.
 */
use wasm_bindgen::prelude::*;
use ed25519_dalek::{SigningKey, VerifyingKey, Signature, Signer, Verifier};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct SignatureResult {
    pub signature: String,
    pub public_key: String,
    pub node_hash: String,
    pub timestamp: String,
}

#[derive(Serialize, Deserialize)]
pub struct VerificationResult {
    pub valid: bool,
    pub node_hash: String,
    pub signer_public_key: String,
}

/// Generates a new Ed25519 keypair for node signing.
/// Returns JSON: { private_key: base64, public_key: base64 }
#[wasm_bindgen]
pub fn generate_keypair() -> String {
    let mut csprng = rand::rngs::OsRng;
    let signing_key = SigningKey::generate(&mut csprng);
    let verifying_key = signing_key.verifying_key();

    serde_json::json!({
        "private_key": BASE64.encode(signing_key.to_bytes()),
        "public_key": BASE64.encode(verifying_key.to_bytes())
    }).to_string()
}

/// Signs a node hash with the user's private key.
/// Returns a SignatureResult as JSON string.
#[wasm_bindgen]
pub fn sign_node(node_hash: &str, private_key_base64: &str) -> String {
    let private_key_bytes = match BASE64.decode(private_key_base64) {
        Ok(bytes) => bytes,
        Err(_) => return serde_json::json!({"error": "Invalid private key encoding"}).to_string(),
    };

    if private_key_bytes.len() != 32 {
        return serde_json::json!({"error": "Private key must be 32 bytes"}).to_string();
    }

    let signing_key = SigningKey::from_bytes(&private_key_bytes.try_into().unwrap());
    let verifying_key = signing_key.verifying_key();
    
    let signature = signing_key.sign(node_hash.as_bytes());

    let result = SignatureResult {
        signature: BASE64.encode(signature.to_bytes()),
        public_key: BASE64.encode(verifying_key.to_bytes()),
        node_hash: node_hash.to_string(),
        timestamp: chrono_lite_now(),
    };

    serde_json::to_string(&result).unwrap_or_else(|_| "{}".to_string())
}

/// Verifies a node signature against the stored public key.
#[wasm_bindgen]
pub fn verify_signature(node_hash: &str, signature_base64: &str, public_key_base64: &str) -> String {
    let sig_bytes = match BASE64.decode(signature_base64) {
        Ok(b) => b,
        Err(_) => return serde_json::json!({"valid": false, "error": "Invalid signature encoding"}).to_string(),
    };

    let pk_bytes = match BASE64.decode(public_key_base64) {
        Ok(b) => b,
        Err(_) => return serde_json::json!({"valid": false, "error": "Invalid public key encoding"}).to_string(),
    };

    if sig_bytes.len() != 64 || pk_bytes.len() != 32 {
        return serde_json::json!({"valid": false, "error": "Invalid key/signature length"}).to_string();
    }

    let signature = Signature::from_bytes(&sig_bytes.try_into().unwrap());
    let verifying_key = match VerifyingKey::from_bytes(&pk_bytes.try_into().unwrap()) {
        Ok(vk) => vk,
        Err(_) => return serde_json::json!({"valid": false, "error": "Invalid public key"}).to_string(),
    };

    let is_valid = verifying_key.verify(node_hash.as_bytes(), &signature).is_ok();

    let result = VerificationResult {
        valid: is_valid,
        node_hash: node_hash.to_string(),
        signer_public_key: public_key_base64.to_string(),
    };

    serde_json::to_string(&result).unwrap_or_else(|_| "{}".to_string())
}

/// Simple timestamp generator (avoids chrono dependency weight)
fn chrono_lite_now() -> String {
    // In WASM, we'll get the timestamp from JS. This is a placeholder.
    "2026-01-22T00:00:00Z".to_string()
}
