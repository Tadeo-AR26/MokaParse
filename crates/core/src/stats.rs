use crate::kanji::kanji_frequency;
use crate::jlpt::JlptLevel;
use crate::jlpt::jlpt_level;
use std::collections::HashMap;

#[derive(Debug, PartialEq, serde::Serialize)]
pub struct TextAnalysis {
    pub total_kanjis: usize,
    pub unique_kanjis: usize,
    pub frequency: HashMap<char, usize>,
    pub jlpt_distribution: HashMap<JlptLevel, usize>
}

pub fn analyze_text(text: &str) -> TextAnalysis {
    //Creo un hash con cada kanji y cuantas veces aparece en el texto
    let map_of_kanjis = kanji_frequency(text);

    //Creo un hash con la cantidad de kanjis de cada nivel que hay
    let mut jlpt_distribution = HashMap::new();
    for (key, value) in map_of_kanjis.iter(){
        *jlpt_distribution.entry(jlpt_level(*key)).or_insert(0) += value;
    }
    TextAnalysis {
        total_kanjis: map_of_kanjis.values().copied().sum(),
        unique_kanjis: map_of_kanjis.len(),
        frequency: map_of_kanjis,
        jlpt_distribution,
    }
}

#[cfg(test)]
mod tests{
    use super::*;
    
    #[test]
    fn test_analyze_text() {
        let frequency = kanji_frequency("日会日");

        let mut expected_distribution = HashMap::new();
        expected_distribution.insert(JlptLevel::N5, 2usize);
        expected_distribution.insert(JlptLevel::N4, 1usize);

        let expected = TextAnalysis{
            total_kanjis: 3,
            unique_kanjis: 2,
            frequency,
            jlpt_distribution: expected_distribution,
        };
        assert_eq!(analyze_text("日会日"), expected);
    }
}