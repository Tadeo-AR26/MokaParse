use clap::Parser;
use std::path::PathBuf;
use moka_core::stats::analyze_text;
use parsers::{TextExtractor, EpubParser, PdfParser};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    #[arg(short, long)]
    file: PathBuf,
}

fn main() -> anyhow::Result<()> {
    let args = Args::parse();
    println!("Analazing data in: {:?}", args.file);

    if let Some(ext) = args.file.extension().and_then(|e| e.to_str()) {
        if ext == "epub" {
            let text = EpubParser::extract_text(&args.file)?;
            let result = analyze_text(&text);
            println!("Result: {:#?}", result);
            
        }
        else if ext == "pdf" {
            let text = PdfParser::extract_text(&args.file)?;

            println!("Text length: {}", text.len());
            println!("Text Preview: {:?}", text.chars().take(100).collect::<String>());

            let result = analyze_text(&text);
            println!("Result: {:#?}", result);
        }
        else {
            anyhow::bail!("Not valid file type")
        }
    }
    Ok(())
}