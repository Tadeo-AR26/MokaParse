use std::path::Path;
use epub::doc::EpubDoc;

pub trait TextExtractor {
    fn extract_text(path: &Path) -> anyhow::Result<String>;
}

pub struct EpubParser;

impl TextExtractor for EpubParser {
    fn extract_text(path: &Path) -> anyhow::Result<String> {
        let mut doc = EpubDoc::new(path)?;
        let mut texto = String::new();
        
        for chapter in 0..doc.get_num_chapters() {
            doc.set_current_chapter(chapter);
            if let Some((content, _)) = doc.get_current_str() {
                texto.push_str(&content)
            }
        }
        Ok(texto)
    }
}


pub struct PdfParser;

impl TextExtractor for PdfParser{
    fn extract_text(path: &Path) -> anyhow::Result<String> {
        let texto = pdf_extract::extract_text(path)?;
        Ok(texto)
    }
}