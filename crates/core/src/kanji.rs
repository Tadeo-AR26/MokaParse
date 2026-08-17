use crate::jlpt::JlptLevel;
use std::collections::HashMap;

pub struct Kanji{
    pub caracter: char,
    pub level: JlptLevel,
}

pub fn is_kanji(c: char) -> bool {
    matches!(c, '\u{4E00}'..='\u{9FFF}')
}

pub fn count_kanjis(text: &str) -> usize {
    text.chars().filter(|&c| is_kanji(c)).count()
}

pub fn kanji_frequency(text: &str) -> HashMap<char, usize> {
    let mut map_of_kanjis = HashMap::new();
    for c in text.chars() {
        if is_kanji(c){
            *map_of_kanjis.entry(c).or_insert(0) += 1;
        }
    }
    map_of_kanjis
}

#[cfg(test)]
mod tests{
    use super::*;

    #[test]
    fn test_is_kanji() {
        assert!(is_kanji('丸'), "丸 kanji must be true");
        assert!(!is_kanji('a'), "a must be false");
        assert!(!is_kanji('あ'), "あ must be false");
    }

    #[test]
    fn test_count_kanji() {
        assert_eq!(count_kanjis("漢字abc"), 2);
        assert_eq!(count_kanjis("helo"), 0);
    }

    #[test]
    fn test_kanji_frequency() {
        let result = kanji_frequency("漢字漢");
        assert_eq!(result.get(&'漢'), Some(&2));
        assert_eq!(result.get(&'字'), Some(&1));
        assert_eq!(result.len(), 2);
    }
}