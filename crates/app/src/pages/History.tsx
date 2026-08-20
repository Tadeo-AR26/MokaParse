import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto relative">
      <h2 className="text-3xl font-bold text-violet-400 mb-8">Analysis History</h2>
      
      {loading ? (
        <p className="text-zinc-400">Loading...</p>
      ) : records.length === 0 ? (
        <div className="bg-zinc-800 p-8 rounded-xl border border-zinc-700 text-center">
          <p className="text-zinc-400">No books found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <div 
              key={record.id} 
              onClick={() => setSelectedRecord(record)}
              className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 flex justify-between items-center hover:border-violet-500 transition-colors cursor-pointer"
            >
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{record.file_name}</h3>
                <p className="text-sm text-zinc-400">Date: {record.analyzed_at}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400 mb-1">Total Kanji</p>
                <p className="text-2xl font-bold text-violet-400">{record.total_kanjis}</p>
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
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{selectedRecord.file_name}</h3>
                  <p className="text-zinc-400">Analyzed on: {selectedRecord.analyzed_at}</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedRecord(null);
                    setShowAllKanjis(false); // Reset state on closing
                  }}
                  className="text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
              
              {/* Analysis full content */}
              <div className="p-6 overflow-y-auto space-y-8">
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 text-center">
                          <p className="text-zinc-400 text-sm">Total Kanjis</p>
                          <p className="text-4xl font-bold text-violet-400 mt-2">{result.total_kanjis}</p>
                      </div>
                      <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 text-center">
                          <p className="text-zinc-400 text-sm">Unique Kanji</p>
                          <p className="text-4xl font-bold text-violet-400 mt-2">{result.unique_kanjis}</p>
                      </div>
                  </div>

                  {/* JLPT Graph */}
                  <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700">
                      <h3 className="text-xl font-semibold mb-6">JLPT Distribution</h3>
                      <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData}>
                                  <XAxis dataKey="name" stroke="#a1a1aa" />
                                  <YAxis stroke="#a1a1aa" />
                                  <Tooltip 
                                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}
                                      itemStyle={{ color: '#a78bfa' }}
                                  />
                                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                      {chartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.name === 'Unknown' ? '#52525b' : '#8b5cf6'} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Kanji Table */}
                  <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-semibold">
                              {showAllKanjis ? "All Kanjis" : "Top 20 Most Used Kanjis"}
                          </h3>
                          <button 
                              onClick={() => setShowAllKanjis(!showAllKanjis)}
                              className="text-sm bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded transition-colors"
                          >
                              {showAllKanjis ? "Show Top 20 only" : "View all"}
                          </button>
                      </div>

                      <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                          {(showAllKanjis ? sortedKanjis : sortedKanjis.slice(0, 20)).map((item, i) => (
                              <div key={i} className="bg-zinc-900 border border-zinc-700 rounded p-3 text-center flex flex-col justify-center">
                                  <span className="text-2xl mb-1">{item.kanji}</span>
                                  <span className="text-xs text-zinc-500">{item.count}x</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
