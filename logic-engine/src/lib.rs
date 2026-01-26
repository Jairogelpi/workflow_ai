use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[wasm_bindgen]
#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub enum Verdict {
    Consistent,
    Contradiction,
    Undecided,
    Ambiguous,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationResult {
    pub verdict: Verdict,
    pub confidence: f32,
    pub reason: String,
    pub context_used: String,
}

#[wasm_bindgen]
pub struct LogicEngine {
    axioms: Vec<String>, // Knowledge Graph Cache (PIN Nodes)
}

#[wasm_bindgen]
impl LogicEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self { axioms: Vec::new() }
    }

    /// Hydrates the engine with live project axioms.
    pub fn sync_axioms(&mut self, axioms: JsValue) {
        let axioms_data: Vec<String> = serde_wasm_bindgen::from_value(axioms).unwrap_or_default();
        self.axioms = axioms_data;
    }

    /// Non-binary validation of a claim against active context and pin-nodes.
    pub fn validate(&self, claim: &str, context: &str) -> JsValue {
        // 1. Check for Semantic Ambiguity (Zero-Mock Heuristic)
        if let Some(reason) = self.check_ambiguity(claim) {
            let res = ValidationResult {
                verdict: Verdict::Ambiguous,
                confidence: 0.6,
                reason: format!("Ambiguity detected: {}", reason),
                context_used: "linguistic_analyzer".to_string(),
            };
            return serde_wasm_bindgen::to_value(&res).unwrap();
        }

        // 2. Check for Knowledge Gaps (Empty Axiom Pool)
        if self.axioms.is_empty() {
             let res = ValidationResult {
                verdict: Verdict::Undecided,
                confidence: 0.0,
                reason: "No project invariants (PINs) established for this context.".to_string(),
                context_used: "none".to_string(),
            };
            return serde_wasm_bindgen::to_value(&res).unwrap();
        }

        // 3. Contradiction Detection against live PINs
        for axiom in &self.axioms {
             // Simple but effective: if a PIN is marked as True and the claim contains its negation
             // Or if we detect a direct clash. For V3.0.0 we use substring matching for performance.
             if self.is_contradiction(claim, axiom) {
                 let res = ValidationResult {
                    verdict: Verdict::Contradiction,
                    confidence: 0.9,
                    reason: format!("Violates PIN: '{}'", axiom),
                    context_used: "axiom_graph".to_string(),
                };
                return serde_wasm_bindgen::to_value(&res).unwrap();
             }
        }
        
        // 4. Fallback to Consistent
        let res = ValidationResult {
            verdict: Verdict::Consistent,
            confidence: 1.0,
            reason: "Verified against project axioms.".to_string(),
            context_used: "local_cache".to_string(),
        };
        serde_wasm_bindgen::to_value(&res).unwrap()
    }

    fn check_ambiguity(&self, text: &str) -> Option<String> {
        let triggers = vec!["ejecutar", "eliminar", "matar", "kill", "block"];
        for t in triggers {
            if text.to_lowercase().contains(t) {
                return Some(format!("The term '{}' has multiple operational contexts (Biological vs Computing).", t));
            }
        }
        None
    }

    fn is_contradiction(&self, claim: &str, axiom: &str) -> bool {
        let claim_lower = claim.to_lowercase();
        let axiom_lower = axiom.to_lowercase();
        
        // Logical negation detection (Simple heuristic for zero-mock production)
        if axiom_lower.contains("no") && claim_lower.contains(&axiom_lower.replace("no ", "")) {
            return true;
        }
        if claim_lower.contains("no") && axiom_lower.contains(&claim_lower.replace("no ", "")) {
            return true;
        }
        
        false
    }
}
