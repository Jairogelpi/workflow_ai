use axum::{
    body::Body,
    http::{Request, StatusCode},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String, // El ID del usuario (UUID de Supabase)
    exp: usize,  // Expiración
    role: String, // 'authenticated', 'service_role', etc.
}

pub async fn auth_middleware(req: Request<Body>, next: Next) -> Result<Response, StatusCode> {
    // 1. Extraer el header Authorization
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|header| header.to_str().ok());

    let auth_header = if let Some(header) = auth_header {
        header
    } else {
        return Err(StatusCode::UNAUTHORIZED);
    };

    // 2. Verificar formato "Bearer <token>"
    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = &auth_header[7..]; // Quitar "Bearer "

    // 3. Obtener el secreto JWT de las variables de entorno
    let secret = env::var("SUPABASE_JWT_SECRET")
        .expect("SUPABASE_JWT_SECRET no configurado en el entorno");

    // 4. Decodificar y Validar
    // Supabase usa HS256 por defecto
    let validation = Validation::new(Algorithm::HS256);
    let key = DecodingKey::from_secret(secret.as_bytes());

    match decode::<Claims>(token, &key, &validation) {
        Ok(_token_data) => {
            // Si el token es válido, pasamos al siguiente handler
            // Opcional: Podrías inyectar el usuario en el request aquí
            Ok(next.run(req).await)
        }
        Err(_) => {
            // Token expirado, firma inválida, etc.
            Err(StatusCode::UNAUTHORIZED)
        }
    }
}
