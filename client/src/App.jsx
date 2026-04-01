import { Navigate, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import Compare from "./pages/Compare.jsx";
import Home from "./pages/Home.jsx";
import Report from "./pages/Report.jsx";
import "./App.css";

function App() {
  return (
    <HelmetProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/report/:username" element={<Report />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HelmetProvider>
  );
}

export default App;
