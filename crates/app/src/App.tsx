import "./App.css";
import Analyzer from "./pages/Analyzer";
import History from "./pages/History";
import Scraper from "./pages/Scraper";
import { HashRouter, Routes, Route, Link } from "react-router-dom";

function App() {
  return (
    <HashRouter>
      {/* Main container */}
      <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
        
        <nav className="bg-zinc-950 p-4 border-b border-zinc-800, flex gap-4">
          <h1 className="font-bold text-violet-500 mr-4">MokaParse</h1>
          <Link to="/" className="text-zinc-300 hover:text-white transition-colors">Analyzer</Link>
          <Link to="/history" className="text-zinc-300 hover:text-white transition-colors">History</Link>
          <Link to="/scraper" className="text-zinc-300 hover:text-white transition-colors">Scraper</Link>
        </nav>

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Analyzer /> } />
            <Route path="/history" element={<History /> } />
            <Route path="/scraper" element={<Scraper /> } />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}

export default App;
