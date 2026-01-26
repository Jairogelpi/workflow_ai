use pyo3::prelude::*;
use std::collections::HashMap;

#[pyclass]
pub struct TruthHypervisor {
    axioms: HashMap<String, bool>,
}

#[pymethods]
impl TruthHypervisor {
    #[new]
    fn new() -> Self {
        TruthHypervisor { axioms: HashMap::new() }
    }

    /// Syncs the dynamic pool of project axioms (PIN nodes).
    fn sync_axioms(&mut self, new_axioms: HashMap<String, bool>) {
        self.axioms = new_axioms;
    }

    /// Calculates penalties for tokens that would validate a falsehood or ignore ambiguity.
    /// Returns a hashmap of ID to penalty.
    fn calculate_logit_bias(&self, context: String, token_to_id: HashMap<String, usize>) -> HashMap<usize, f32> {
        let mut biases = HashMap::new();
        let context_lower = context.to_lowercase();

        // 1. Ambiguity Detection (Zero-Mock Heuristic)
        let ambiguity_triggers = vec!["ejecutar", "eliminar", "matar", "kill"];
        let mut is_ambiguous = false;
        for t in ambiguity_triggers {
            if context_lower.contains(t) {
                is_ambiguous = true;
                break;
            }
        }

        // 2. Analyze context against known fallacies
        let mut detected_trap = false;
        for (axiom, &is_true) in &self.axioms {
            if !is_true && context_lower.contains(&axiom.to_lowercase()) {
                detected_trap = true;
                break;
            }
        }

        // 3. Apply Penalties
        if detected_trap {
            // Absolute Veto on agreement tokens
            let veto_tokens = vec![
                "sí", "si", "yes", "cierto", "correct", "true", "correctamente", 
                "efectivamente", "así es", "exacto", "perfecto", "claro", "por supuesto"
            ];
            for token in veto_tokens {
                if let Some(&id) = token_to_id.get(token) {
                    biases.insert(id, -100.0);
                }
            }
        }
        
        if is_ambiguous {
            // Soft Penalty on definitive tokens, boosting "depends" or "context"
            let caution_tokens = vec!["siempre", "nunca", "obligatorio", "always", "never"];
            for token in caution_tokens {
                if let Some(&id) = token_to_id.get(token) {
                    biases.insert(id, -5.0); // Soft discouragement
                }
            }
        }

        biases
    }

    fn add_axiom(&mut self, claim: String, is_true: bool) {
        self.axioms.insert(claim, is_true);
    }
}

#[pymodule]
fn neuro_hypervisor(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_class::<TruthHypervisor>()?;
    Ok(())
}
