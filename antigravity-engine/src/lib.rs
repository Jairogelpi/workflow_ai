use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Node {
    pub id: String,
    pub x: f32,
    pub y: f32,
    pub is_pin: bool,
}

#[wasm_bindgen]
pub fn apply_forces(nodes_val: JsValue, _edges_val: JsValue) -> JsValue {
    let mut nodes: Vec<Node> = serde_wasm_bindgen::from_value(nodes_val).unwrap();
    
    // Performance: Rust handles thousands of nodes in microseconds
    for i in 0..nodes.len() {
        if nodes[i].is_pin { continue; } // PIN nodes are anchored Truth
        
        // Semantic Gravity Simulation: Shift nodes towards their center
        // In a full implementation, this integrates glam for vector math
        nodes[i].x += 0.5 * (100.0 - nodes[i].x).signum();
        nodes[i].y += 0.5 * (100.0 - nodes[i].y).signum();
    }

    serde_wasm_bindgen::to_value(&nodes).unwrap()
}
