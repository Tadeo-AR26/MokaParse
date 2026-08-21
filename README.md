# MokaParse

> A Japanese text analysis tool for learners — analyze any EPUB or PDF book and instantly see its Kanji distribution by JLPT level.

![Version](https://img.shields.io/badge/version-1.0.0-violet)
![License](https://img.shields.io/badge/license-MIT-blue)
![Rust](https://img.shields.io/badge/language-Rust-orange)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

---

## Table of Contents

- [What is MokaParse?](#what-is-mokaparse)
- [Features](#features)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
  - [Workspace Layout](#workspace-layout)
  - [Core Library (`crates/core`)](#core-library-cratescore)
  - [Parsers (`crates/parsers`)](#parsers-cratesparsers)
  - [CLI (`crates/cli`)](#cli-cratescli)
  - [GUI App (`crates/app`)](#gui-app-cratesapp)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Build & Run — CLI](#build--run--cli)
  - [Build & Run — Desktop GUI](#build--run--desktop-gui)
- [Usage](#usage)
  - [CLI Usage](#cli-usage)
  - [GUI Usage](#gui-usage)
- [JLPT Levels](#jlpt-levels)
- [Anki Export](#anki-export)
- [Contributing](#contributing)
- [License](#license)

---

## What is MokaParse?

MokaParse is a **desktop application and CLI tool** written in Rust that helps Japanese language learners understand the vocabulary difficulty of any Japanese book.

Given an EPUB or PDF file, MokaParse will:

1. Extract all the text from the book.
2. Identify every **Kanji** character (CJK Unified Ideographs, U+4E00–U+9FFF).
3. Look up each Kanji in a built-in dictionary and classify it by **JLPT level** (N5 → N1, or Unknown).
4. Return a full breakdown: total Kanji count, unique Kanji count, per-character frequency, and JLPT distribution.

This lets you answer questions like: *"Is this novel suitable for an N3 learner?"* or *"Which Kanjis appear most often in this manga?"*

---

## Features

| Feature | CLI | GUI |
|---|:---:|:---:|
| Analyze EPUB files | ✅ | ✅ |
| Analyze PDF files | ✅ | ✅ |
| Total & unique Kanji count | ✅ | ✅ |
| Kanji frequency ranking | ✅ | ✅ |
| JLPT level distribution | ✅ | ✅ |
| Interactive bar chart | ❌ | ✅ |
| Top 20 / All Kanjis grid | ❌ | ✅ |
| Analysis history (SQLite) | ❌ | ✅ |
| Light & Dark theme | ❌ | ✅ |
| Anki deck export (.tsv) | ❌ | ✅ |

---

## Architecture

MokaParse is organized as a **Cargo workspace** with four crates. Each crate has a single, well-defined responsibility.

### Workspace Layout

```
MokaParse/
├── Cargo.toml                  ← Workspace root
└── crates/
    ├── core/                   ← Pure analysis library (no I/O)
    ├── parsers/                ← File format adapters (EPUB, PDF)
    ├── cli/                    ← Command-line interface
    └── app/                    ← Tauri desktop application
        ├── src/                ← React + TypeScript frontend
        └── src-tauri/          ← Tauri backend (Rust)
```

---

### Core Library (`crates/core`)

The heart of MokaParse. A **pure Rust library** with no side effects — it takes text and returns structured data.

**Key modules:**

| Module | Responsibility |
|---|---|
| `kanji.rs` | Iterates a string, identifies Kanji characters (Unicode range U+4E00–U+9FFF), and builds a frequency `HashMap<char, usize>`. |
| `jlpt.rs` | Classifies a single Kanji character into a `JlptLevel` enum (`N1`–`N5`, `Unknown`) by looking it up in the bundled dictionary. |
| `readings.rs` | Loads and exposes the embedded Kanji dictionary as a lazy static `HashMap`. |
| `stats.rs` | The main entry point: `analyze_text(&str) -> TextAnalysis`. Combines the frequency map and JLPT classification into a `TextAnalysis` struct. |

**`TextAnalysis` struct** (the return value of every analysis):

```rust
pub struct TextAnalysis {
    pub total_kanjis: usize,              // Sum of all Kanji occurrences
    pub unique_kanjis: usize,             // Number of distinct Kanji found
    pub frequency: HashMap<char, usize>,  // Per-character occurrence count
    pub jlpt_distribution: HashMap<JlptLevel, usize>, // Count per JLPT level
}
```

The struct derives `serde::Serialize`, so it can be serialized directly to JSON for both the CLI output and the GUI via Tauri's IPC bridge.

---

### Parsers (`crates/parsers`)

Adapters that extract raw `String` text from different file formats. Each parser implements the `TextExtractor` trait:

```rust
pub trait TextExtractor {
    fn extract_text(path: &Path) -> anyhow::Result<String>;
}
```

| Parser | Crate used | Notes |
|---|---|---|
| `EpubParser` | `epub` | Iterates over all spine items and concatenates text content. |
| `PdfParser` | `pdf-extract` | Extracts text layer from each page. |

---

### CLI (`crates/cli`)

A minimal command-line tool that wraps the core library. Built with **`clap`** for argument parsing.

```
mokaparse --file <PATH>
```

Accepts `.epub` or `.pdf` files and prints the `TextAnalysis` result to stdout using Rust's debug formatter (`{:#?}`).

---

### GUI App (`crates/app`)

A cross-platform **desktop application** built with [Tauri v2](https://v2.tauri.app/). It bridges a React + TypeScript frontend with the Rust backend.

**Backend (`src-tauri/`)**

| File | Responsibility |
|---|---|
| `lib.rs` | Tauri app entry point: initializes the SQLite database, registers plugins (`dialog`, `opener`), and declares Tauri commands. |
| `commands.rs` | Two `#[tauri::command]` functions exposed to the frontend: `analyze_file_command` (runs the full analysis pipeline and saves to DB) and `get_history_command` (reads history from DB). |
| `db/mod.rs` | SQLite layer using `rusqlite`. Handles table creation (`init()`), inserting records (`save_history()`), and querying records (`get_history()`). |
| `db/schema.rs` | SQL `CREATE TABLE IF NOT EXISTS` statements for `analysis_history` and `word_of_day`. |

**Data flow for an analysis:**
```
User clicks "Open File"
    → Tauri dialog plugin (file picker)
    → frontend calls invoke("analyze_file_command", { filePath })
    → Rust: parse file with EpubParser / PdfParser
    → Rust: moka_core::stats::analyze_text(&text)
    → Rust: serialize result to JSON, save to SQLite
    → Rust: return TextAnalysis to frontend
    → React: render bar chart (Recharts) + Kanji grid
```

**Frontend (`src/`)**

Built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS v4**.

| Page | Description |
|---|---|
| `Analyzer` | File picker, analysis trigger, results dashboard (summary cards, JLPT bar chart, Kanji frequency grid with Top 20 / Show All toggle). |
| `History` | List of all past analyses loaded from SQLite. Clicking any entry opens a modal with the full dashboard (same chart + grid), reconstructed from the stored JSON. |
| `Scraper` | Reserved for a future word-of-the-day feature. |

**Routing** uses `HashRouter` from `react-router-dom` due to Tauri's static file serving (no server-side routing).

---

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable, `rustup update`)
- [Node.js](https://nodejs.org/) v18+ and [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- Tauri system dependencies for your platform — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

### Build & Run — CLI

```bash
# From the workspace root
cargo run -p cli -- --file path/to/book.epub
cargo run -p cli -- --file path/to/book.pdf
```

To build a release binary:

```bash
cargo build -p cli --release
# Binary will be at: target/release/cli(.exe)
```

### Build & Run — Desktop GUI

```bash
cd crates/app
pnpm install       # Install frontend dependencies (first time only)
pnpm tauri dev     # Start in development mode (hot-reload)
```

To build a distributable installer:

```bash
pnpm tauri build
# Installer will be at: target/release/bundle/
```

---

## Usage

### CLI Usage

```bash
# Analyze an EPUB
./cli --file my-novel.epub

# Analyze a PDF
./cli --file textbook.pdf
```

**Example output:**

```
Analyzing data in: "my-novel.epub"
Result: TextAnalysis {
    total_kanjis: 14823,
    unique_kanjis: 412,
    frequency: { '日': 243, '人': 198, ... },
    jlpt_distribution: { N5: 5210, N4: 3844, N3: 2100, N2: 1540, N1: 890, Unknown: 1239 },
}
```

### GUI Usage

1. **Launch the application** (`pnpm tauri dev` or the installed executable).
2. **Analyzer tab**: Click **"Open File"**, select an `.epub` or `.pdf` file, and wait for the analysis to complete.
3. **Review results**: The dashboard shows:
   - Total Kanji count and unique Kanji count.
   - A bar chart with Kanji counts per JLPT level (N5 to N1, plus Unknown).
   - A grid of the **Top 20 most frequent Kanjis**. Click **"View all"** to see every Kanji found.
4. **History tab**: Every past analysis is saved automatically. Click any entry to open a full detail modal with the same dashboard.
5. **Theme toggle**: Use the floating button in the bottom-right corner to switch between Light and Dark mode.

---

## JLPT Levels

The Japanese Language Proficiency Test (JLPT) has 5 levels:

| Level | Description |
|---|---|
| **N5** | Beginner — most basic Kanji (日, 月, 人, …) |
| **N4** | Elementary |
| **N3** | Intermediate |
| **N2** | Upper-intermediate |
| **N1** | Advanced — complex, rare Kanji |
| **Unknown** | Kanji not present in the JLPT classification (very rare, archaic, or proper nouns) |

As a rough guide: if the majority of a book's Kanjis fall in N5/N4, it's accessible to beginners; a high proportion of N1/Unknown suggests advanced difficulty.

---

## Anki Export

After analyzing a book, MokaParse can generate an Anki flashcard deck directly from the Kanjis found in the text. The export modal is accessible from the Analyzer page once a result is available.

### Workflow

1. Analyze a book — the **"Export to Anki"** button appears with the results.
2. The export modal opens with a **pre-populated table** of every Kanji found, enriched with reading data from the built-in dictionary.
3. **Filter** the table by JLPT level (N5 / N4 / N3 / N2 / N1 / Unknown) to narrow down the deck.
4. **Check or uncheck** individual Kanjis. Use **"Select All / Deselect All"** for bulk changes.
5. Choose which fields to include: On'yomi, Kun'yomi, Romaji transcription, English meanings.
6. Click **"Generate .TSV Deck"**, choose a save location, and import the file into Anki.

### Output format

The exported file is a **tab-separated values (.tsv)** file, one card per line, importable directly into Anki via *File → Import*.

Each line is two columns separated by a tab character:

| Column | Content |
|---|---|
| **Front** | The Kanji character, rendered large and centered via inline HTML (`<div style="font-size: 4em; text-align: center;">海</div>`) |
| **Back** | On'yomi (カイ / kai) · Kun'yomi (うみ / umi) · Meanings · JLPT level — all as HTML with `<b>` labels |

**Example back field:**
```html
<b>On'yomi:</b> カイ (kai)<br><br><b>Kun'yomi:</b> うみ (umi)<br><br><span style="font-size: 1.25em;"><b>Meanings:</b> sea, ocean</span><br><br><b>JLPT:</b> N4
```

### Kanji dictionary

Reading and classification data is sourced from **two complementary datasets**, merged at build time into a single embedded `kanji_readings.json` file inside `crates/core/data/`:

| Dataset | Source | Used for |
|---|---|---|
| **KANJIDIC2** | Electronic Dictionary Research and Development Group (EDRDG) | On'yomi, Kun'yomi, Hepburn romanization, English meanings. Licensed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). |
| **JLPT N1–N5 kanji lists** | Updated community lists (`n1_kanji.csv` – `n5_kanji.csv`) | JLPT level classification per Kanji. These supplement KANJIDIC2 because KANJIDIC2's built-in JLPT field only covers the pre-2010 4-level system and does not include the modern N5 level introduced after the 2010 JLPT reform. |

The merged `kanji_readings.json` contains a `KanjiInfo` entry for each Kanji with all fields unified, loaded once at startup via `OnceLock` (Rust's lazy-static equivalent from the standard library).

### Technical implementation

| Layer | File | Responsibility |
|---|---|---|
| `crates/core` | `readings.rs` | `KanjiInfo` struct + lazy-static dictionary lookup (`get_dictionary()`) |
| `crates/app/src-tauri` | `commands.rs` | `get_kanji_readings` command (enriches a list of Kanji chars with reading data) · `export_to_anki` command (writes the TSV file to disk) |
| `crates/app/src` | `AnkiExport.tsx` | Modal component: JLPT filter toggles, checkbox table, export options, `save` dialog via `tauri-plugin-dialog` |

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes.

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

By using or contributing to MokaParse, you agree to the terms of this license.
