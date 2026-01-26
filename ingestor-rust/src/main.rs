mod auth;
mod parsers;
mod chunking;

use axum::{
    extract::{HeaderMap},
    routing::{get, post},
    Router, Json,
    middleware,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::{CorsLayer, Any};
use dotenvy::dotenv;

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
    
    dotenv().ok();
    
    // Check JWT Secret
    if std::env::var("SUPABASE_JWT_SECRET").is_err() {
        tracing::error!("🔥 CRITICAL: SUPABASE_JWT_SECRET is not set.");
        panic!("SUPABASE_JWT_SECRET required");
    }

    // Define the application router
    let app = Router::new()
        .route("/health", get(|| async { "OK" }))
        .route("/process", post(process_file))
        .layer(middleware::from_fn(auth::auth_middleware))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any)
        )
        .layer(axum::extract::DefaultBodyLimit::max(500 * 1024 * 1024)); // 500MB Limit

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    tracing::info!("WorkGraph Ingestor (Rust) listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
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

    // Zero-Copy approach: Pass Bytes reference instead of cloning to Vec<u8>
    // 1. Parsing
    let text = if file_type == "html" {
        let raw_html = String::from_utf8_lossy(&body);
        parsers::parse_html(&raw_html)
    } else {
        // PDF parser still needs the full buffer for now, but we avoid one redundant clone
        parsers::parse_pdf(body.to_vec()).unwrap_or_else(|e| format!("Error parsing PDF: {}", e))
    };

    // 2. Semantic Chunking (800 chars target for RLM)
    let chunks = chunking::create_semantic_chunks(&text, 800);

    Json(IngestResponse {
        chunks,
        engine: "rust-worker-v4-optim".to_string(),
    })
}
