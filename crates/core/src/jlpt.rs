#[derive(Debug, PartialEq, Hash, Eq)]
pub enum JlptLevel {
    N1,
    N2,
    N3,
    N4,
    N5,
    Unknown,
}

pub fn jlpt_level(c: char) -> JlptLevel {
    let data_n5 = include_str!("../data/jlpt_n5.txt");
    let data_n4 = include_str!("../data/jlpt_n4.txt");

    if data_n5.contains(c){
        JlptLevel::N5
    } else if data_n4.contains(c){
        JlptLevel::N4
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