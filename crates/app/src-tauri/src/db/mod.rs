pub mod schema;
use rusqlite::{params, Connection};
use serde::Serialize;

pub fn init() -> rusqlite::Result<()> {
    let connection = Connection::open("moka_data.db")?;
    connection.execute(schema::INIT_HISTORY_TABLE, [])?;
    connection.execute(schema::INIT_SCRAPER_TABLE, [])?;

    Ok(())
}

#[derive(Serialize)]
pub struct HistoryRecord{
    pub id: i32,
    pub file_name: String,
    pub analyzed_at: String,
    pub total_kanjis: i32,
    pub summary_json: String,
}

pub fn save_history(file_name: &str, total_kanjis: usize, summary_json: &str) ->
Result<(), String> {
    let connection = Connection::open("moka_data.db").map_err(|e| e.to_string())?;
    
    connection.execute("INSERT INTO analysis_history
    (file_name, analyzed_at, total_kanjis, summary_json)
    VALUES (?1, datetime('now', 'localtime'), ?2, ?3)",
    params![file_name, total_kanjis, summary_json],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn get_history() -> Result<Vec<HistoryRecord>, String> {
    let connection = Connection::open("moka_data.db").map_err(|e| e.to_string())?;

    let mut stmt = connection.prepare("SELECT id, file_name, analyzed_at, total_kanjis, summary_json
    FROM analysis_history ORDER BY id DESC").map_err(|e| e.to_string())?;
    
    let records = stmt.query_map([], |row| {
        Ok(HistoryRecord {
            id: row.get(0)?,
            file_name: row.get(1)?,
            analyzed_at: row.get(2)?,
            total_kanjis: row.get(3)?,
            summary_json: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut history_list = Vec::new();
    for record in records {
        if let Ok(r) = record {
            history_list.push(r);
        }
    }

    Ok(history_list)
}

pub fn delete_history(id: i32) -> Result<(), String> {
    let connection = Connection::open("moka_data.db").map_err(|e| e.to_string())?;
    
    connection.execute("DELETE FROM analysis_history WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
        
    Ok(())
}