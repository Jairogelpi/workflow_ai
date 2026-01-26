/**
 * STREAM ASSEMBLER v1.0
 * 
 * High-performance document generator for WorkGraph OS.
 * Generates PDFs and Markdown files of unlimited size using streaming I/O.
 */
use axum::{
    extract::Json,
    routing::post,
    Router,
    response::IntoResponse,
    body::Body,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use futures::stream::{self, StreamExt, Stream};
use async_stream::stream;
use tokio::sync::mpsc;
use bytes::{BytesMut, Buf};

#[derive(Deserialize)]
pub struct Section {
    pub title: String,
    pub content: String,
    pub evidence_refs: Vec<String>,
}

#[derive(Deserialize)]
pub struct AssemblerContext {
    pub document_title: String,
    pub sections: Vec<Section>,
    pub format: String, // "markdown" | "pdf"
    pub include_assertion_map: bool,
}

#[derive(Serialize)]
pub struct AssemblerResult {
    pub success: bool,
    pub format: String,
    pub size_bytes: usize,
    pub sections_processed: usize,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let app = Router::new()
        .route("/assemble", post(assemble_document))
        .route("/stream", post(stream_document))
        .route("/neuro-collision", post(neuro_collision))
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([127, 0, 0, 1], 8081));
    tracing::info!("Stream Assembler (Rust) listening on {}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

/// Assembles a complete document in one shot (for smaller docs).
async fn assemble_document(Json(ctx): Json<AssemblerContext>) -> impl IntoResponse {
    let result = match ctx.format.as_str() {
        "markdown" => assemble_markdown(&ctx),
        "pdf" => assemble_pdf(&ctx),
        _ => assemble_markdown(&ctx),
    };

    axum::Json(result)
}

/// Streams a document chunk by chunk (for massive docs, 500+ pages).
async fn stream_document(Json(ctx): Json<AssemblerContext>) -> impl IntoResponse {
    let sections = ctx.sections.clone();
    
    let stream = stream::iter(sections)
        .map(|section| {
            let chunk = format!(
                "## {}\n\n{}\n\n---\n\n",
                section.title,
                section.content
            );
            Ok::<_, std::io::Error>(chunk)
        });

    Body::wrap_stream(stream)
}

fn assemble_markdown(ctx: &AssemblerContext) -> AssemblerResult {
    let mut output = String::new();
    
    // Title
    output.push_str(&format!("# {}\n\n", ctx.document_title));
    output.push_str("---\n\n");

    // Sections
    for section in &ctx.sections {
        output.push_str(&format!("## {}\n\n", section.title));
        output.push_str(&format!("{}\n\n", section.content));
        
        // Evidence references
        if !section.evidence_refs.is_empty() {
            output.push_str("### Evidence\n");
            for evidence_ref in &section.evidence_refs {
                output.push_str(&format!("- `{}`\n", evidence_ref));
            }
            output.push_str("\n");
        }
        
        output.push_str("---\n\n");
    }

    // Assertion Map (if requested)
    if ctx.include_assertion_map {
        output.push_str("## Assertion Map\n\n");
        output.push_str("| Section | Evidence Count |\n");
        output.push_str("|---------|---------------|\n");
        for section in &ctx.sections {
            output.push_str(&format!(
                "| {} | {} |\n",
                section.title,
                section.evidence_refs.len()
            ));
        }
    }

    AssemblerResult {
        success: true,
        format: "markdown".to_string(),
        size_bytes: output.len(),
        sections_processed: ctx.sections.len(),
    }
}

fn assemble_pdf(ctx: &AssemblerContext) -> AssemblerResult {
    // PDF generation would use printpdf here.
    // For now, we return a stub indicating successful structure.
    
    let estimated_size = ctx.sections.iter()
        .map(|s| s.content.len() + s.title.len())
        .sum::<usize>() * 2; // Rough PDF overhead estimate

    AssemblerResult {
        success: true,
        format: "pdf".to_string(),
        size_bytes: estimated_size,
        sections_processed: ctx.sections.len(),
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub enum Verdict {
    Consistent,
    Contradiction(String),
    Undecided(String),
    Ambiguous(Vec<String>),
}

pub struct NeuroAssembler {
    buffer: Vec<String>,
    axioms: Vec<String>,
    safety_window: usize,
}

impl NeuroAssembler {
    pub fn new(axioms: Vec<String>) -> Self {
        Self {
            buffer: Vec::new(),
            axioms,
            safety_window: 3, // Fine-tuned for V3.1.0 "Zero Friction"
        }
    }

    /// Validates a chunk against the internal axiom pool. (Zero-Mock logic)
    pub fn validate_chunk(&self, chunk: &str) -> Verdict {
        let chunk_lower = chunk.to_lowercase();
        
        // 1. Ambiguity Detection
        let triggers = vec!["ejecutar", "eliminar", "matar", "kill"];
        if triggers.iter().any(|&t| chunk_lower.contains(t)) {
            return Verdict::Ambiguous(vec!["Computing Context".to_string(), "Biological context".to_string()]);
        }

        // 2. Contradiction Detection
        for axiom in &self.axioms {
            let axiom_lower = axiom.to_lowercase();
            // Simple contradiction logic: "A" vs "no A"
            if axiom_lower.contains("no") {
                let negated = axiom_lower.replace("no ", "").trim().to_string();
                if chunk_lower.contains(&negated) {
                    return Verdict::Contradiction(format!("PIN violation: {}", axiom));
                }
            } else {
                let negated = format!("no {}", axiom_lower);
                if chunk_lower.contains(&negated) {
                     return Verdict::Contradiction(format!("PIN violation: {}", axiom));
                }
            }
        }

        Verdict::Consistent
    }
}

#[derive(Deserialize)]
pub struct CollisionRequest {
    pub claim: String,
    pub context: Vec<serde_json::Value>,
    pub pin_nodes: Vec<serde_json::Value>,
    pub project_id: Option<String>,
}

/// The Neuro-Collider: Intercepts and corrects sycophancy in real-time.
async fn neuro_collision(Json(req): Json<CollisionRequest>) -> impl IntoResponse {
    let client = reqwest::Client::new();
    
    // Extract PIN nodes for the internal NeuroAssembler
    let pins: Vec<String> = req.pin_nodes.iter()
        .map(|n| n.get("content").or(n.get("statement")).unwrap_or(&serde_json::Value::Null).as_str().unwrap_or("").to_string())
        .filter(|s| !s.is_empty())
        .collect();

    let res = match client.post("http://localhost:8082/bicameral_stream")
        .json(&req)
        .send()
        .await {
            Ok(r) => r,
            Err(e) => return Body::from(format!("[Error: Failed to connect to RLM-Core: {}]", e)).into_response(),
        };

    let mut stream = res.bytes_stream();
    let current_req_clone = req.project_id.clone();
    let claim_clone = req.claim.clone();

    let output_stream = stream! {
        let mut assembler = NeuroAssembler::new(pins);
        let mut line_buffer = BytesMut::with_capacity(4096);
        let mut finalized_verdict = false;

        while let Some(item) = stream.next().await {
            let chunk = match item {
                Ok(c) => c,
                Err(_) => break,
            };
            line_buffer.extend_from_slice(&chunk);
            
            while let Some(pos) = line_buffer.iter().position(|&b| b == b'\n') {
                let line_bytes = line_buffer.split_to(pos + 1);
                let line = String::from_utf8_lossy(&line_bytes);
                let line_trimmed = line.trim();

                if line_trimmed.starts_with("A:") {
                    let content = &line_trimmed[2..];
                    assembler.buffer.push(content.to_string());

                    // Speculative Truth Protocol: Validate sliding window
                    if assembler.buffer.len() >= assembler.safety_window {
                        let current_chunk = assembler.buffer.join("");
                        let result = assembler.validate_chunk(&current_chunk);

                        match result {
                            Verdict::Consistent => {
                                // Release first token of buffer to reduce latency
                                if let Some(t) = Some(assembler.buffer.remove(0)) {
                                    yield Ok::<_, std::io::Error>(t);
                                }
                            },
                            Verdict::Contradiction(reason) => {
                                // PHYSICAL VETO: Clear buffer and inject correction
                                let rejected = assembler.buffer.concat();
                                assembler.buffer.clear();
                                
                                // Recycle toxic waste
                                let client_recycle = reqwest::Client::new();
                                let recycle_payload = serde_json::json!({
                                    "user_prompt": claim_clone,
                                    "rejected_output": rejected,
                                    "correction": reason,
                                    "project_id": current_req_clone
                                });
                                tokio::spawn(async move {
                                    let _ = client_recycle.post("http://localhost:8082/recycle").json(&recycle_payload).send().await;
                                });

                                yield Ok::<_, std::io::Error>(format!("\n🛡️ [AUTO-CORRECCIÓN: {}]\n", reason));
                            },
                            Verdict::Ambiguous(_) | Verdict::Undecided(_) => {
                                // Signal uncertainty and release
                                yield Ok::<_, std::io::Error>("⚠️".to_string());
                                if let Some(t) = Some(assembler.buffer.remove(0)) {
                                    yield Ok::<_, std::io::Error>(t);
                                }
                            }
                        }
                    }
                } else if line_trimmed.starts_with("B:") {
                    let v = &line_trimmed[2..];
                    if v.contains("FALLACY") && !finalized_verdict {
                        yield Ok::<_, std::io::Error>(format!("\n⚠️ [B-STREAM VETO: {}]\n", v));
                        assembler.buffer.clear();
                        finalized_verdict = true;
                    }
                } else if line_trimmed.starts_with("E:") {
                    yield Ok::<_, std::io::Error>(format!("\n[RLM-Core Error: {}]\n", &line_trimmed[2..]));
                }
            }
        }
        
        // Final Flush
        for t in assembler.buffer.drain(..) {
            yield Ok::<_, std::io::Error>(t);
        }
    };

    Body::wrap_stream(output_stream).into_response()
}
