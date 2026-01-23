/**
 * LOGIC ENGINE v1.0
 * 
 * SAT-based constraint solver for WorkGraph PIN verification.
 * Detects contradictions and logical inconsistencies in massive graphs.
 */
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use varisat::{Solver, Lit, CnfFormula, ExtendFormula};
use std::collections::HashMap;

#[derive(Serialize, Deserialize)]
pub struct GraphEdge {
    pub source: String,
    pub target: String,
    pub relation: String, // "supports", "contradicts", "blocks", "depends_on"
}

#[derive(Serialize, Deserialize)]
pub struct GraphNode {
    pub id: String,
    pub is_pin: bool,
    pub node_type: String,
}

#[derive(Serialize, Deserialize)]
pub struct GraphData {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
}

#[derive(Serialize, Deserialize)]
pub struct VerificationResult {
    pub consistent: bool,
    pub violations: Vec<String>,
    pub checked_constraints: usize,
}

/// Checks if the graph maintains PIN consistency.
/// Returns JSON VerificationResult.
#[wasm_bindgen]
pub fn check_pin_consistency(graph_json: &str) -> String {
    let graph: GraphData = match serde_json::from_str(graph_json) {
        Ok(g) => g,
        Err(e) => return serde_json::json!({
            "consistent": false,
            "violations": [format!("Failed to parse graph: {}", e)],
            "checked_constraints": 0
        }).to_string(),
    };

    let mut violations = Vec::new();
    let mut node_map: HashMap<String, usize> = HashMap::new();
    
    // Assign SAT variables to each node
    for (i, node) in graph.nodes.iter().enumerate() {
        node_map.insert(node.id.clone(), i + 1); // SAT vars are 1-indexed
    }

    let mut formula = CnfFormula::new();
    let mut constraint_count = 0;

    // Process edges as logical constraints
    for edge in &graph.edges {
        let source_var = match node_map.get(&edge.source) {
            Some(&v) => v,
            None => continue,
        };
        let target_var = match node_map.get(&edge.target) {
            Some(&v) => v,
            None => continue,
        };

        match edge.relation.as_str() {
            "supports" => {
                // If source is true, target should be true: ¬source ∨ target
                let s = varisat::Var::from_index(source_var);
                let t = varisat::Var::from_index(target_var);
                formula.add_clause(&[Lit::negative(s), Lit::positive(t)]);
                constraint_count += 1;
            }
            "contradicts" => {
                // source and target cannot both be true: ¬source ∨ ¬target
                let s = varisat::Var::from_index(source_var);
                let t = varisat::Var::from_index(target_var);
                formula.add_clause(&[Lit::negative(s), Lit::negative(t)]);
                constraint_count += 1;
                
                // Check if target is a PIN (violation!)
                if let Some(target_node) = graph.nodes.iter().find(|n| n.id == edge.target) {
                    if target_node.is_pin {
                        violations.push(format!(
                            "CRITICAL: Node '{}' contradicts PIN node '{}'",
                            edge.source, edge.target
                        ));
                    }
                }
            }
            "blocks" => {
                // If source is true, target must be false: source → ¬target
                let s = varisat::Var::from_index(source_var);
                let t = varisat::Var::from_index(target_var);
                formula.add_clause(&[Lit::negative(s), Lit::negative(t)]);
                constraint_count += 1;
            }
            "depends_on" => {
                // target must be true for source to be valid: ¬source ∨ target
                let s = varisat::Var::from_index(source_var);
                let t = varisat::Var::from_index(target_var);
                formula.add_clause(&[Lit::negative(s), Lit::positive(t)]);
                constraint_count += 1;
            }
            _ => {}
        }
    }

    // Force all PIN nodes to be true (they are invariants)
    for node in &graph.nodes {
        if node.is_pin {
            if let Some(&var_idx) = node_map.get(&node.id) {
                let v = varisat::Var::from_index(var_idx);
                formula.add_clause(&[Lit::positive(v)]);
                constraint_count += 1;
            }
        }
    }

    // Solve the SAT problem
    let mut solver = Solver::new();
    solver.add_formula(&formula);

    let consistent = match solver.solve() {
        Ok(true) => violations.is_empty(),
        Ok(false) => {
            if violations.is_empty() {
                violations.push("UNSAT: The graph contains irreconcilable logical contradictions.".to_string());
            }
            false
        }
        Err(e) => {
            violations.push(format!("Solver error: {}", e));
            false
        }
    };

    let result = VerificationResult {
        consistent,
        violations,
        checked_constraints: constraint_count,
    };

    serde_json::to_string(&result).unwrap_or_else(|_| "{}".to_string())
}
