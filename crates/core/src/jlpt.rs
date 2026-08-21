#[derive(Debug, PartialEq, Hash, Eq,  serde::Serialize)]
pub enum JlptLevel {
    N1,
    N2,
    N3,
    N4,
    N5,
    Unknown,
}

use crate::readings::get_dictionary;

pub fn jlpt_level(c: char) -> JlptLevel {
    let kanji_str = c.to_string();
    if let Some(info) = get_dictionary().get(&kanji_str) {
        match info.jlpt {
            Some(1) => JlptLevel::N1,
            Some(2) => JlptLevel::N2,
            Some(3) => JlptLevel::N3,
            Some(4) => JlptLevel::N4,
            Some(5) => JlptLevel::N5,
            _ => JlptLevel::Unknown,
        }
    } else {
        JlptLevel::Unknown
    }
}

#[cfg(test)]
mod tests{
    use super::*;

    #[test]
    fn test_jlpt_level() {
        assert_eq!(jlpt_level('日'), JlptLevel::N5);
        assert_eq!(jlpt_level('会'), JlptLevel::N4);
        assert_eq!(jlpt_level('x'), JlptLevel::Unknown);
    }
}