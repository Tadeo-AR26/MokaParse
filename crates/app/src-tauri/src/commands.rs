use moka_core::stats::{analyze_text, TextAnalysis};
use parsers::{EpubParser, PdfParser, TextExtractor};
use std::path::Path;

#[tauri::command]
pub fn analyze_file_command(file_path: String) -> Result<TextAnalysis, String> {
    let path = Path::new(&file_path);

    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        if ext == "epub" {
            let text = EpubParser::extract_text(path).map_err(|e| e.to_string())?;
            let result = analyze_text(&text);
            Ok(result)
        } else if ext == "pdf" {
            let text = PdfParser::extract_text(path).map_err(|e| e.to_string())?;
            let result = analyze_text(&text);
            Ok(result)
        } else {
            Err("Not valid file type".to_string())
        }
    } else {
        Err("File has no extension".to_string())
    }
}