#[derive(serde::Serialize)]
pub struct KanjiInfo {
    #[serde(skip_serializing)]
    pub kanji: String,
    pub onyomi: Vec<String>,
    pub kunyomi: Vec<String>,
    pub onyomi_romaji: Vec<String>,
    pub kunyomi_romaji: Vec<String>,
    pub meanings: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub jlpt: Option<u8>,
}

use quick_xml::events::Event;
use quick_xml::Reader;
use std::collections::HashMap;
use wana_kana::ConvertJapanese;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut reader = Reader::from_file("data/kanjidic2.xml")?;
    reader.config_mut().trim_text(true);

    let mut buf = Vec::new();
    let mut dictionary: HashMap<String, KanjiInfo> = HashMap::new();

    let mut current_kanji: Option<KanjiInfo> = None;
    let mut current_tag = String::new();
    let mut is_ja_on = false;
    let mut is_ja_kun = false;
    let mut is_eng_meaning = false;

    println!("Procesando KANJIDIC2... Esto puede tomar unos segundos.");

    loop {
        match reader.read_event_into(&mut buf)? {
            Event::Eof => break,
            
            Event::Start(ref e) => {
                match e.name().as_ref() {
                    b"character" => {
                        current_kanji = Some(KanjiInfo {
                            kanji: String::new(),
                            onyomi: Vec::new(),
                            kunyomi: Vec::new(),
                            onyomi_romaji: Vec::new(),
                            kunyomi_romaji: Vec::new(),
                            meanings: Vec::new(),
                            jlpt: None,
                        });
                    },
                    b"literal" => current_tag = "literal".to_string(),
                    b"jlpt" => current_tag = "jlpt".to_string(),
                    b"meaning" => {
                        current_tag = "meaning".to_string();
                        is_eng_meaning = !e.attributes().any(|a| a.is_ok_and(|attr| attr.key.as_ref() == b"m_lang"));
                    },
                    b"reading" => {
                        current_tag = "reading".to_string();
                        for attr in e.attributes().flatten() {
                            if attr.key.as_ref() == b"r_type" {
                                if attr.value.as_ref() == b"ja_on" {
                                    is_ja_on = true;
                                } else if attr.value.as_ref() == b"ja_kun" {
                                    is_ja_kun = true;
                                }
                            }
                        }
                    },
                    _ => (),
                }
            },
            
            Event::Text(e) => {
                if let Some(kanji) = current_kanji.as_mut() {
                    // Si falla el unescape, usamos utf8 lossy (Kanjidic es puro UTF-8)
                    let text = std::str::from_utf8(e.as_ref()).unwrap_or("").to_string();
                    
                    match current_tag.as_str() {
                        "literal" => kanji.kanji = text,
                        "jlpt" => kanji.jlpt = text.parse::<u8>().ok(),
                        "meaning" if is_eng_meaning => kanji.meanings.push(text),
                        "reading" if is_ja_on => {
                            kanji.onyomi_romaji.push(text.to_romaji());
                            kanji.onyomi.push(text);
                        },
                        "reading" if is_ja_kun => {
                            let clean_text = text.replace('.', "");
                            kanji.kunyomi_romaji.push(clean_text.to_romaji());
                            kanji.kunyomi.push(text);
                        },
                        _ => (),
                    }
                }
            },
            
            Event::End(ref e) => {
                match e.name().as_ref() {
                    b"character" => {
                        if let Some(kanji) = current_kanji.take() {
                            dictionary.insert(kanji.kanji.clone(), kanji);
                        }
                    },
                    b"literal" | b"jlpt" => current_tag.clear(),
                    b"meaning" => {
                        current_tag.clear();
                        is_eng_meaning = false;
                    },
                    b"reading" => {
                        current_tag.clear();
                        is_ja_on = false;
                        is_ja_kun = false;
                    },
                    _ => (),
                }
            },
            _ => (),
        }
        buf.clear();
    }

    println!("¡Lectura completada! Encontramos {} kanjis.", dictionary.len());

    let output_file = std::fs::File::create("data/kanji_readings.json")?;
    serde_json::to_writer(&output_file, &dictionary)?;
    
    println!("¡Diccionario guardado en kanji_readings.json exitosamente!");

    Ok(())
}

