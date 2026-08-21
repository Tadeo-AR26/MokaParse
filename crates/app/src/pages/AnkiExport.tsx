import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import "./AnkiExport.css";

export type KanjiInfo = {
  kanji: string | null;
  onyomi: string[];
  kunyomi: string[];
  onyomi_romaji: string[];
  kunyomi_romaji: string[];
  meanings: string[];
  jlpt: number | null;
};

type AnkiExportProps = {
  isOpen: boolean;
  onClose: () => void;
  kanjiList: { kanji: string; count: number }[]; // from the analysis result
};

export default function AnkiExport({ isOpen, onClose, kanjiList }: AnkiExportProps) {
  const [readings, setReadings] = useState<KanjiInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKanjis, setSelectedKanjis] = useState<Set<string>>(new Set());
  
  // Filters
  const [jlptFilters, setJlptFilters] = useState<Set<string>>(new Set(["N5", "N4", "N3", "N2", "N1", "Unknown"]));
  
  // Options
  const [options, setOptions] = useState({
    onyomi: true,
    kunyomi: true,
    romaji: true,
    meanings: true,
  });

  // Load readings from backend when opened
  useEffect(() => {
    if (!isOpen || kanjiList.length === 0) return;
    
    async function fetchReadings() {
      setLoading(true);
      try {
        const kanjisToFetch = kanjiList.map(k => k.kanji);
        const data = await invoke<KanjiInfo[]>("get_kanji_readings", { kanjis: kanjisToFetch });
        setReadings(data);
        // Pre-select all by default
        setSelectedKanjis(new Set(kanjisToFetch));
      } catch (err) {
        console.error("Failed to load kanji readings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReadings();
  }, [isOpen, kanjiList]);

  if (!isOpen) return null;

  const toggleJlptFilter = (level: string) => {
    const newFilters = new Set(jlptFilters);
    if (newFilters.has(level)) {
      newFilters.delete(level);
    } else {
      newFilters.add(level);
    }
    setJlptFilters(newFilters);
  };

  const toggleKanjiSelection = (kanji: string) => {
    const newSelected = new Set(selectedKanjis);
    if (newSelected.has(kanji)) {
      newSelected.delete(kanji);
    } else {
      newSelected.add(kanji);
    }
    setSelectedKanjis(newSelected);
  };

  // Filter the list to display based on JLPT filters
  const filteredReadings = readings.filter(r => {
    const levelStr = r.jlpt ? `N${r.jlpt}` : "Unknown";
    return jlptFilters.has(levelStr);
  });

  const toggleSelectAll = () => {
    if (selectedKanjis.size === filteredReadings.length) {
      setSelectedKanjis(new Set()); // Deselect all currently filtered
    } else {
      setSelectedKanjis(new Set(filteredReadings.map(r => r.kanji as string)));
    }
  };

  const handleExport = async () => {
    try {
      const savePath = await save({
        filters: [{ name: "Anki TSV Deck", extensions: ["tsv"] }],
        defaultPath: "moka_parse_export.tsv"
      });

      if (!savePath) return; // user cancelled

      // Prepare data for backend
      // Filter only selected kanjis
      const kanjisToExport = readings.filter(r => r.kanji && selectedKanjis.has(r.kanji));

      // Apply the export options by clearing fields if not requested
      const payload = kanjisToExport.map(r => ({
        ...r,
        onyomi: options.onyomi ? r.onyomi : [],
        kunyomi: options.kunyomi ? r.kunyomi : [],
        onyomi_romaji: options.romaji ? r.onyomi_romaji : [],
        kunyomi_romaji: options.romaji ? r.kunyomi_romaji : [],
        meanings: options.meanings ? r.meanings : []
      }));

      await invoke("export_to_anki", { path: savePath, kanjis: payload });
      alert("Deck exported successfully! You can now import the TSV into Anki.");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to export: " + err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content anki-modal">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Anki Export</h3>
            <p className="modal-subtitle">Generate a .tsv deck to import into Anki</p>
          </div>
          <button onClick={onClose} className="modal-close-btn">Close</button>
        </div>

        <div className="modal-body anki-modal-body">
          {loading ? (
            <p>Loading kanji dictionary...</p>
          ) : (
            <div className="anki-content-grid">
              
              <div className="anki-sidebar">
                <div className="filter-section">
                  <h4>Filter by JLPT</h4>
                  <div className="jlpt-toggles">
                    {["N5", "N4", "N3", "N2", "N1", "Unknown"].map(lvl => (
                      <button 
                        key={lvl}
                        className={`filter-btn ${jlptFilters.has(lvl) ? 'active' : ''}`}
                        onClick={() => toggleJlptFilter(lvl)}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="options-section">
                  <h4>Export Options</h4>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={options.onyomi} onChange={(e) => setOptions({...options, onyomi: e.target.checked})} />
                    Include On'yomi
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={options.kunyomi} onChange={(e) => setOptions({...options, kunyomi: e.target.checked})} />
                    Include Kun'yomi
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={options.romaji} onChange={(e) => setOptions({...options, romaji: e.target.checked})} />
                    Include Romaji
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={options.meanings} onChange={(e) => setOptions({...options, meanings: e.target.checked})} />
                    Include Meanings
                  </label>
                </div>

                <div className="export-action">
                  <p className="selection-count">
                    {selectedKanjis.size} kanjis selected
                  </p>
                  <button 
                    className="btn-primary export-btn" 
                    onClick={handleExport}
                    disabled={selectedKanjis.size === 0}
                  >
                    Generate .TSV Deck
                  </button>
                </div>
              </div>

              <div className="anki-main-table">
                <div className="table-actions">
                  <button onClick={toggleSelectAll} className="btn-secondary">
                    {selectedKanjis.size === filteredReadings.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                
                <div className="table-container">
                  <table className="kanji-table">
                    <thead>
                      <tr>
                        <th>☑</th>
                        <th>Kanji</th>
                        <th>On'yomi</th>
                        <th>Kun'yomi</th>
                        <th>JLPT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReadings.map((r, i) => (
                        <tr key={i} className={selectedKanjis.has(r.kanji as string) ? 'selected-row' : ''}>
                          <td>
                            <input 
                              type="checkbox" 
                              checked={selectedKanjis.has(r.kanji as string)} 
                              onChange={() => toggleKanjiSelection(r.kanji as string)}
                            />
                          </td>
                          <td className="table-kanji-char">{r.kanji}</td>
                          <td className="table-readings">{r.onyomi.join(', ')}</td>
                          <td className="table-readings">{r.kunyomi.join(', ')}</td>
                          <td>{r.jlpt ? `N${r.jlpt}` : '?'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
