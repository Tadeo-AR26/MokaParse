import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export default function Analyzer() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null); //Completar esto mas tarde
    const [error, setError] = useState<string | null>(null);

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
                    <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700">
                        <p className="text-green-400 font-bold mb-4">Analysis Completed</p>
                        <pre className="text-sm text-zinc-300 overflow-x-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
        </div>
    )
}