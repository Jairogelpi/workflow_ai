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

    /// Calculates penalties for tokens that would validate a falsehood.
    /// Returns a hashmap of ID to penalty.
    fn calculate_logit_bias(&self, context: String, token_to_id: HashMap<String, usize>) -> HashMap<usize, f32> {
        let mut biases = HashMap::new();

        // 1. Analyze context against known fallacies (Axioms marked as false)
        let mut detected_trap = false;
        let mut context_lower = context.to_lowercase();
        
        for (axiom, &is_true) in &self.axioms {
            if !is_true && context_lower.contains(&axiom.to_lowercase()) {
                detected_trap = true;
                break;
            }
        }

        // 2. If a trap is detected, apply absolute veto to agreement tokens
        if detected_trap {
            let veto_tokens = vec![
                "sí", "si", "yes", "cierto", "correct", "true", "correctamente", 
                "efectivamente", "así es", "exacto", "perfecto", "claro", "por supuesto"
            ];
            for token in veto_tokens {
                if let Some(&id) = token_to_id.get(token) {
                    biases.insert(id, -100.0); // Suppress the token
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
fn logic_engine(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_class::<TruthHypervisor>()?;
    Ok(())
}
