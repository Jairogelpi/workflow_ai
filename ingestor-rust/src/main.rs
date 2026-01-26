mod parsers;
mod chunking;

use axum::{
    extract::{HeaderMap},
    routing::post,
    Router, Json,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::cors::{CorsLayer, Any};
use axum::{
    middleware::{self, Next},
    response::Response,
    http::{StatusCode, Request},
};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use dotenv::dotenv;
use std::env;
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
    
    // Define the application router
    let app = Router::new()
        .route("/process", post(process_file))
        .layer(middleware::from_fn(auth_middleware))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any)
        );

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

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    aud: String,
    exp: usize,
}

async fn auth_middleware<B>(
    req: Request<B>,
    next: Next<B>,
) -> Result<Response, StatusCode> {
    let auth_header = req.headers()
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    match auth_header {
        Some(auth_header) if auth_header.starts_with("Bearer ") => {
            let token = &auth_header[7..];
            let secret = env::var("SUPABASE_JWT_SECRET").map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            
            let mut validation = Validation::new(Algorithm::HS256);
            validation.set_audience(&["authenticated"]);

            match decode::<Claims>(
                token,
                &DecodingKey::from_secret(secret.as_bytes()),
                &validation,
            ) {
                Ok(_) => Ok(next.run(req).await),
                Err(_) => Err(StatusCode::UNAUTHORIZED),
            }
        }
        _ => Err(StatusCode::UNAUTHORIZED),
    }
}
