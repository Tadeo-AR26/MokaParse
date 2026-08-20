import { useState, useEffect } from "react";
import "./App.css";
import Analyzer from "./pages/Analyzer";
import History from "./pages/History";
import { HashRouter, Routes, Route, NavLink } from "react-router-dom";

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <HashRouter>
      {/* Main container */}
      <div className="app-container">
        
        <nav className="nav-bar">
          <NavLink to="/" className="nav-brand">MokaParse</NavLink>
          
          <div className="nav-links">
            <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Analyzer</NavLink>
            <NavLink to="/history" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>History</NavLink>
            <NavLink to="/anki" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Anki Export</NavLink>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Analyzer />} />
            <Route path="/history" element={<History />} />
            {/* TODO: <Route path="/anki" element={<AnkiExport />} /> */}
          </Routes>
        </main>

        {/* Floating Theme Toggle */}
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </div>
    </HashRouter>
  )
}

export default App;

