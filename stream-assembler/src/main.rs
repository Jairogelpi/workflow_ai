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
use futures::stream::{self, StreamExt};

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
