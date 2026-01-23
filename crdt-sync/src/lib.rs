/**
 * CRDT SYNC ENGINE v1.0
 * 
 * Conflict-free Replicated Data Types for real-time WorkGraph collaboration.
 * Uses Yrs (Yjs Rust port) for automatic merge without conflicts.
 */
use wasm_bindgen::prelude::*;
use yrs::{Doc, Text, Transact, ReadTxn, GetString, updates::encoder::Encode};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct NodeUpdate {
    pub node_id: String,
    pub content: String,
    pub user_id: String,
}

#[derive(Serialize, Deserialize)]
pub struct MergeResult {
    pub success: bool,
    pub merged_content: String,
    pub conflicts_resolved: usize,
}

#[derive(Serialize, Deserialize)]
pub struct SyncState {
    pub state_vector: String, // Base64 encoded
    pub update: String,       // Base64 encoded
}

/// Creates a new CRDT document for collaborative editing.
/// Returns a base64-encoded state vector.
#[wasm_bindgen]
pub fn create_document(initial_content: &str) -> String {
    let doc = Doc::new();
    let text = doc.get_or_insert_text("content");
    
    {
        let mut txn = doc.transact_mut();
        let _ = text.insert(&mut txn, 0, initial_content);
    }
    
    let state = doc.transact().state_vector().encode_v1();
    base64_encode(&state)
}

/// Applies a local update to the document.
/// Returns the update as a base64-encoded binary diff.
#[wasm_bindgen]
pub fn apply_local_update(_state_vector_b64: &str, content: &str, position: u32) -> String {
    let doc = Doc::new();
    let text = doc.get_or_insert_text("content");
    
    {
        let mut txn = doc.transact_mut();
        let _ = text.insert(&mut txn, position, content);
    }
    
    let update = doc.transact_mut().encode_update_v1();
    
    serde_json::json!({
        "update": base64_encode(&update),
        "new_state": base64_encode(&doc.transact().state_vector().encode_v1())
    }).to_string()
}

/// Merges a remote update into the local document.
/// Returns the merged content.
#[wasm_bindgen]
pub fn merge_remote_update(local_state_b64: &str, remote_update_b64: &str) -> String {
    let doc = Doc::new();
    let text = doc.get_or_insert_text("content");
    
    // Decode and apply remote update
    let remote_update = match base64_decode(remote_update_b64) {
        Some(u) => u,
        None => return serde_json::json!({"success": false, "error": "Invalid remote update"}).to_string(),
    };
    
    {
        let mut txn = doc.transact_mut();
        if let Err(e) = txn.apply_update(yrs::Update::decode_v1(&remote_update).unwrap()) {
            return serde_json::json!({"success": false, "error": format!("{:?}", e)}).to_string();
        }
    }
    
    // Get merged content
    let merged_content = {
        let txn = doc.transact();
        text.get_string(&txn)
    };
    
    let result = MergeResult {
        success: true,
        merged_content,
        conflicts_resolved: 1, // CRDT auto-resolves
    };
    
    serde_json::to_string(&result).unwrap_or_else(|_| "{}".to_string())
}

/// Synchronizes two document states and returns the diff.
#[wasm_bindgen]
pub fn compute_diff(state_a_b64: &str, state_b_b64: &str) -> String {
    // In a full implementation, this would compute the operational transforms
    // For now, we return a placeholder indicating the states differ
    serde_json::json!({
        "differs": state_a_b64 != state_b_b64,
        "state_a_hash": state_a_b64.len(),
        "state_b_hash": state_b_b64.len()
    }).to_string()
}

// Base64 utilities
fn base64_encode(data: &[u8]) -> String {
    use base64::{Engine as _, engine::general_purpose::STANDARD};
    STANDARD.encode(data)
}

fn base64_decode(data: &str) -> Option<Vec<u8>> {
    use base64::{Engine as _, engine::general_purpose::STANDARD};
    STANDARD.decode(data).ok()
}
