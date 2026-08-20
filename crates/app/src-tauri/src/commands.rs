use moka_core::stats::{analyze_text, TextAnalysis};
use parsers::{EpubParser, PdfParser, TextExtractor};
use std::path::Path;
use crate::db;

#[tauri::command]
pub fn analyze_file_command(file_path: String) -> Result<TextAnalysis, String> {
    let path = Path::new(&file_path);
    let file_name = path.file_name().unwrap_or_default().to_string_lossy();

    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        let result = if ext == "epub" {
            let text = EpubParser::extract_text(path).map_err(|e| e.to_string())?;
            analyze_text(&text)
        } else if ext == "pdf" {
            let text = PdfParser::extract_text(path).map_err(|e| e.to_string())?;
            analyze_text(&text)
        } else {
            return Err("Not valid file type".to_string());
        };

        let json_str = serde_json::to_string(&result).map_err(|e| e.to_string())?;
        db::save_history(&file_name, result.total_kanjis, &json_str)?;

        Ok(result)
    } else {
        Err("File has no extension".to_string())
    }
}

#[tauri::command]
pub fn get_history_command() -> Result<Vec<db::HistoryRecord>, String> {
    db::get_history()
}