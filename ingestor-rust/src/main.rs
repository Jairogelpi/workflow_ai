mod parsers;
mod chunking;

use axum::{
    extract::{HeaderMap},
    routing::post,
    Router, Json,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

#[derive(Serialize)]
struct IngestResponse {
    chunks: Vec<String>,
    engine: String,
}

#[derive(Deserialize)]
struct IngestParams {
    max_chunk_size: Option<usize>,
}

#[tokio::main]
async fn main() {
    // Initialize tracing for observability
    tracing_subscriber::fmt::init();
    
    // Define the application router
    let app = Router::new()
        .route("/process", post(process_file))
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    tracing::info!("WorkGraph Ingestor (Rust) listening on {}", addr);
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

/**
 * Unified Process Handler
 * Receives the byte stream, detects the type, and orchestrates parsing + chunking.
 */
async fn process_file(
    headers: HeaderMap,
    body: axum::body::Bytes,
) -> Json<IngestResponse> {
    let file_type = headers.get("X-File-Type")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("pdf");

    let data = body.to_vec();
    
    // 1. Parsing
    let text = if file_type == "html" {
        let raw_html = String::from_utf8_lossy(&data);
        parsers::parse_html(&raw_html)
    } else {
        parsers::parse_pdf(data).unwrap_or_else(|e| format!("Error parsing PDF: {}", e))
    };

    // 2. Semantic Chunking (800 chars target for RLM)
    let chunks = chunking::create_semantic_chunks(&text, 800);

    Json(IngestResponse {
        chunks,
        engine: "rust-worker-v1".to_string(),
    })
}
