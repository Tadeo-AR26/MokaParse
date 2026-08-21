use moka_core::stats::{analyze_text, TextAnalysis};
use parsers::{EpubParser, PdfParser, TextExtractor};
use moka_core::readings::{get_dictionary, KanjiInfo};
use std::path::Path;
use std::fs::File;
use std::io::Write;
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

#[tauri::command]
pub fn get_kanji_readings(kanjis: Vec<String>) -> Result<Vec<KanjiInfo>, String> {
    let dic = get_dictionary();
    let mut results = Vec::new();
    for kanji in kanjis {
        if let Some(info) = dic.get(&kanji) {
            let mut info_clone = info.clone();
            info_clone.kanji = Some(kanji.clone());
            results.push(info_clone);
        }
    }
    Ok(results)
}

#[tauri::command]
pub fn export_to_anki(path: String, kanjis: Vec<KanjiInfo>) -> Result<(), String> {
    let mut file = File::create(path).map_err(|e| e.to_string())?;

    for kanji_info in kanjis {
        let kanji_str = kanji_info.kanji.unwrap_or_default();
        
        // Hacemos el kanji frontal mucho más grande y centrado
        let kanji_html = format!("<div style=\"font-size: 4em; text-align: center;\">{}</div>", kanji_str);

        let mut back_parts = Vec::new();

        if !kanji_info.onyomi.is_empty() {
            let mut text = format!("<b>On'yomi:</b> {}", kanji_info.onyomi.join(", "));
            if !kanji_info.onyomi_romaji.is_empty() {
                text.push_str(&format!(" ({})", kanji_info.onyomi_romaji.join(", ")));
            }
            back_parts.push(text);
        }

        if !kanji_info.kunyomi.is_empty() {
            let mut text = format!("<b>Kun'yomi:</b> {}", kanji_info.kunyomi.join(", "));
            if !kanji_info.kunyomi_romaji.is_empty() {
                text.push_str(&format!(" ({})", kanji_info.kunyomi_romaji.join(", ")));
            }
            back_parts.push(text);
        }

        if !kanji_info.meanings.is_empty() {
            // Hacemos el significado ligeramente más grande
            back_parts.push(format!("<span style=\"font-size: 1.25em;\"><b>Meanings:</b> {}</span>", kanji_info.meanings.join(", ")));
        }

        if let Some(jlpt) = kanji_info.jlpt {
            back_parts.push(format!("<b>JLPT:</b> N{}", jlpt));
        }

        let back_str = back_parts.join("<br><br>");

        writeln!(file, "{}\t{}", kanji_html, back_str).map_err(|e| e.to_string())?;
    }

    Ok(())
}