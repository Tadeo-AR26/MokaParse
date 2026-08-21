use std::sync::OnceLock;
use std::collections::HashMap;

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct KanjiInfo {
    pub kanji: Option<String>,
    pub onyomi: Vec<String>,
    pub kunyomi: Vec<String>,
    pub onyomi_romaji: Vec<String>,
    pub kunyomi_romaji: Vec<String>,
    pub meanings: Vec<String>,
    pub jlpt: Option<u8>,
}

static DICTIONARY: OnceLock<HashMap<String, KanjiInfo>> = OnceLock::new();

pub fn get_dictionary() -> &'static HashMap<String, KanjiInfo> {
    DICTIONARY.get_or_init(|| {
        let json_str = include_str!("../data/kanji_readings.json");
        let data: HashMap<String, KanjiInfo> = serde_json::from_str(json_str)
        .expect("JSON File is corrupt");
        data
    })
}