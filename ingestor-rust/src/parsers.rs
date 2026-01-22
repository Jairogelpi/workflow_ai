use lopdf::Document;
use scraper::{Html, Selector};

/**
 * PDF Parsing Logic
 * Uses lopdf to extract text efficiently from memory buffers.
 */
pub fn parse_pdf(data: Vec<u8>) -> Result<String, String> {
    let doc = Document::load_mem(&data).map_err(|e| e.to_string())?;
    let mut content = String::new();
    
    // Iterate through pages and collect text objects
    for page in doc.get_pages() {
        if let Ok(text) = doc.get_page_text(page.0) {
            content.push_str(&text);
            content.push('\n');
        }
    }
    
    Ok(content)
}

/**
 * HTML Parsing Logic
 * Uses scraper to extract semantic content while stripping noise (scripts, styles).
 */
pub fn parse_html(html_content: &str) -> String {
    let fragment = Html::parse_document(html_content);
    
    // Select meaningful semantic blocks
    let selector = Selector::parse("article, p, h1, h2, h3, li, blockquote").unwrap();
    
    fragment.select(&selector)
        .map(|element| element.text().collect::<Vec<_>>().join(" "))
        .collect::<Vec<_>>()
        .join("\n\n")
}
