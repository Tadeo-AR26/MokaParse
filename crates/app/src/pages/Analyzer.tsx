import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import "./Analyzer.css";

export default function Analyzer() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showAllKanjis, setShowAllKanjis] = useState(false);

    async function handleOpenFile(){
        try {
            setError(null);
            const selectedPath = await open({
                multiple: false,
                filters: [{name: 'Books',
                    extensions: ['epub', 'pdf']
                }]
            });

            if(!selectedPath) return; //User cancelled

            setIsAnalyzing(true);

            const analysisResult = await invoke("analyze_file_command", 
                {filePath: selectedPath}
            );

            setResult(analysisResult);
        } catch (err) {
            console.error(err);
            setError(String(err));
        } finally {
            setIsAnalyzing(false);
        }
    }

    let chartData: any[] = [];
    let sortedKanjis: any[] = [];

    if(result){
        const jlptOrder = ["N5", "N4", "N3", "N2", "N1", "Unknown"];
        chartData = jlptOrder.map(level => 
        ({
            name: level,
            count: result.jlpt_distribution[level] || 0
        })
        );

        sortedKanjis = Object.entries(result.frequency)
        .map(([kanji, count]) => ({
            kanji, count: Number(count) }))
            .sort((a, b) => b.count - a.count);
    }

    const tooltipStyle = { backgroundColor: 'var(--surface-solid)', borderColor: 'var(--surface-border)', color: 'var(--text-main)', borderRadius: '0.5rem', padding: '1rem', boxShadow: 'var(--surface-shadow)' };

    return (
        <div className="analyzer-container">
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

            <h2 className="page-title">Text Analyzer</h2>
            <div className="action-card">
                <div>
                    <h3 className="action-title">Select a book</h3>
                    <p className="action-subtitle">Supports .epub and .pdf</p>
                </div>
                <button onClick={handleOpenFile}
                disabled={isAnalyzing}
                className="btn-primary">
                    {isAnalyzing ? "Analyzing..." : "Open File"}
                </button>
            </div>
            
            {/* Zona de Errores */}
            {error && (
                <div className="error-box">
                    <p>Error: {error}</p>
                </div>
            )}

            {/* Zona de Resultados */}
            {result && (
                <div>
                    {/* Tarjetas de Resumen */}
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

                    {/* Gráfico JLPT */}
                    <div className="chart-card">
                        <h3 className="card-title">JLPT Distribution</h3>
                        <div style={{ height: '350px' }}>
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

                    {/* Tabla de Kanjis */}
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
            )}
        </div>
    )
}