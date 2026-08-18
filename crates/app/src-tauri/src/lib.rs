mod db;
mod commands;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|_app| {
            db::init().expect("Critical Error. Failed to initialize the database");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![commands::analyze_file_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
