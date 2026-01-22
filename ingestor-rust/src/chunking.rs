use text_splitter::TextSplitter;

/**
 * Semantic Chunking Motor
 * Uses text-splitter to create fragments that respect paragraph and sentence boundaries.
 */
pub fn create_semantic_chunks(text: &str, max_chars: usize) -> Vec<String> {
    // Rust splitter is ~30x faster than JS equivalent for large technical manuals
    let splitter = TextSplitter::default()
        .with_max_characters(max_chars);
        
    splitter.chunks(text)
        .map(|s| s.to_string())
        .collect()
}
