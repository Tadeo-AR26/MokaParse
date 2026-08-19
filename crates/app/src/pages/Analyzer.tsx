import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Analyzer() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null); //Completar esto mas tarde
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
    return (
        <div className="p-8 max-w-6x1 mx-auto">
            <h2 className="text-3x1 font-bold text-violet-400 mb-8">Text Analyzer</h2>
            <div className="bg-zinc-800 p-6 rounded-x1 border border-zinc-700 mb-8 flex items-center
            justify-between">
                <div>
                    <h3 className="text-x1 font-semibold mb-2">Select a book</h3>
                    <p className="text-zinc-400">Supports .epub and .pdf</p>
                </div>
                <button onClick={handleOpenFile}
                disabled={isAnalyzing}
                className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3
                rounded-lg font-medium transition-colors disable:opacity-50">
                    {isAnalyzing ? "Analyzing..." : "Open File"}
                </button>
            </div>
                {/* Zona de Errores */}
                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-8">
                        <p>Error: {error}</p>
                    </div>
                )}

                    {/* Zona de Resultados */}
                    {result && (
                        <div className="space-y-8">
                            {/* Tarjetas de Resumen */}
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

                            {/* Gráfico JLPT */}
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

                            {/* Tabla de Kanjis */}
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
                    )}

        </div>
    )
}