import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { confirm } from "@tauri-apps/plugin-dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import AnkiExport from "./AnkiExport";
import "./History.css";

type HistoryRecord = {
  id: number;
  file_name: string;
  analyzed_at: string;
  total_kanjis: number;
  summary_json: string;
};

export default function History() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [showAllKanjis, setShowAllKanjis] = useState(false);
  const [isAnkiExportOpen, setIsAnkiExportOpen] = useState(false);

  async function loadHistory() {
    try {
      const data = await invoke<HistoryRecord[]>("get_history_command");
      setRecords(data);
    } catch (error) {
      console.error("Error loading the history:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRecord(id: number) {
    const isConfirmed = await confirm("Are you sure you want to delete this record from the history?", { 
        title: "Delete Record", 
        kind: "warning" 
    });
    
    if (isConfirmed) {
      try {
        await invoke("delete_history_command", { id });
        setSelectedRecord(null);
        loadHistory();
      } catch (error) {
        console.error("Error deleting record:", error);
        alert("Failed to delete record");
      }
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const tooltipStyle = { backgroundColor: 'var(--surface-solid)', borderColor: 'var(--surface-border)', color: 'var(--text-main)', borderRadius: '0.5rem', padding: '1rem', boxShadow: 'var(--surface-shadow)' };

  return (
    <div className="history-container">
      {/* Defs for gradients */}
      <svg width="0" height="0">
          <defs>
              <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-color)" />
                  <stop offset="100%" stopColor="#87CEFA" />
              </linearGradient>
              <linearGradient id="unknownGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--text-muted)" />
                  <stop offset="100%" stopColor="var(--surface-border)" />
              </linearGradient>
          </defs>
      </svg>
      <h2 className="page-title">Analysis History</h2>
      
      {loading ? (
        <p style={{color: 'var(--text-muted)'}}>Loading...</p>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <p>No books found.</p>
        </div>
      ) : (
        <div className="history-list">
          {records.map((record) => (
            <div 
              key={record.id} 
              onClick={() => setSelectedRecord(record)}
              className="history-item"
            >
              <div>
                <h3 className="history-title">{record.file_name}</h3>
                <p className="history-date">Date: {record.analyzed_at}</p>
              </div>
              <div>
                <p className="history-stat-label">Total Kanji</p>
                <p className="history-stat-value">{record.total_kanjis}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRecord && (() => {
        const result = JSON.parse(selectedRecord.summary_json);
        
        const jlptOrder = ["N5", "N4", "N3", "N2", "N1", "Unknown"];
        const chartData = jlptOrder.map(level => ({
            name: level,
            count: result.jlpt_distribution[level] || 0
        }));

        const sortedKanjis = Object.entries(result.frequency)
            .map(([kanji, count]) => ({ kanji, count: Number(count) }))
            .sort((a, b) => b.count - a.count);

        return (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">{selectedRecord.file_name}</h3>
                  <p className="modal-subtitle">Analyzed on: {selectedRecord.analyzed_at}</p>
                </div>
                <div>
                  <button 
                    onClick={() => handleDeleteRecord(selectedRecord.id)}
                    className="modal-close-btn"
                    style={{marginRight: '1rem', color: 'var(--danger)', padding: '0.8rem 1.5rem'}}
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => setIsAnkiExportOpen(true)}
                    className="btn-primary"
                    style={{marginRight: '1rem', padding: '0.8rem 1.5rem'}}
                  >
                    Export to Anki
                  </button>
                  <button 
                    onClick={() => {
                    setSelectedRecord(null);
                    setShowAllKanjis(false);
                  }}
                  className="modal-close-btn"
                >
                  Close
                  </button>
                </div>
              </div>
              
              {/* Analysis full content */}
              <div className="modal-body">
                  {/* Summary cards */}
                  <div className="summary-grid">
                      <div className="summary-card">
                          <p className="summary-label">Total Kanjis</p>
                          <p className="summary-value">{result.total_kanjis}</p>
                      </div>
                      <div className="summary-card">
                          <p className="summary-label">Unique Kanji</p>
                          <p className="summary-value">{result.unique_kanjis}</p>
                      </div>
                  </div>

                  {/* JLPT Graph */}
                  <div className="chart-card">
                      <h3 className="card-title" style={{marginBottom: '1rem'}}>JLPT Distribution</h3>
                      <div style={{height: '350px'}}>
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                                  <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                                  <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                                  <Tooltip 
                                      contentStyle={tooltipStyle}
                                      itemStyle={{ color: 'var(--primary-color)', fontWeight: '600' }}
                                      cursor={{fill: 'var(--backdrop)'}}
                                  />
                                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                      {chartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.name === 'Unknown' ? 'url(#unknownGradient)' : 'url(#primaryGradient)'} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Kanji Table */}
                  <div className="kanji-card">
                      <div className="card-header">
                          <h3 className="card-title">
                              {showAllKanjis ? "All Kanjis" : "Top 20 Most Used Kanjis"}
                          </h3>
                          <button 
                              onClick={() => setShowAllKanjis(!showAllKanjis)}
                              className="btn-secondary"
                          >
                              {showAllKanjis ? "Show Top 20 only" : "View all"}
                          </button>
                      </div>

                      <div className="kanji-grid">
                          {(showAllKanjis ? sortedKanjis : sortedKanjis.slice(0, 20)).map((item, i) => (
                              <div key={i} className="kanji-item">
                                  <span className="kanji-char">{item.kanji}</span>
                                  <span className="kanji-count">{item.count}x</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
              
              <AnkiExport 
                  isOpen={isAnkiExportOpen} 
                  onClose={() => setIsAnkiExportOpen(false)} 
                  kanjiList={sortedKanjis} 
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
