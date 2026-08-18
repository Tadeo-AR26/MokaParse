pub mod schema;
use rusqlite::Connection;

pub fn init() -> rusqlite::Result<()> {
    let connection = Connection::open("moka_data.db")?;
    connection.execute(schema::INIT_HISTORY_TABLE, [])?;
    connection.execute(schema::INIT_SCRAPER_TABLE, [])?;

    Ok(())
}