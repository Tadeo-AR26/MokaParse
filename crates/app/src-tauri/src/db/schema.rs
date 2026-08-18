pub const INIT_HISTORY_TABLE: &str = "CREATE TABLE IF NOT EXISTS analysis_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name    TEXT,
  analyzed_at  TEXT NOT NULL,
  total_kanjis INTEGER NOT NULL,
  summary_json TEXT NOT NULL   -- AnalysisResult serializado
);";

pub const INIT_SCRAPER_TABLE: &str = "CREATE TABLE IF NOT EXISTS word_of_day (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  kanji       TEXT NOT NULL,
  reading     TEXT NOT NULL,
  meaning     TEXT NOT NULL,
  jlpt_level  TEXT NOT NULL,
  fetched_at  TEXT NOT NULL,
  source_url  TEXT
);";