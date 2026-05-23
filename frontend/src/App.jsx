import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import UploadLecture from "./pages/UploadLecture";
import Transcribe from "./pages/Transcribe";
import Notes from "./pages/Notes";
import Quiz from "./pages/Quiz";
import Emotion from "./pages/Emotion";
import Recommend from "./pages/Recommend";
import Analytics from "./pages/Analytics";              // ← NEW

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/upload" element={token ? <UploadLecture /> : <Navigate to="/login" />} />
        <Route path="/transcribe" element={token ? <Transcribe /> : <Navigate to="/login" />} />
        <Route path="/notes" element={token ? <Notes /> : <Navigate to="/login" />} />
        <Route path="/quiz" element={token ? <Quiz /> : <Navigate to="/login" />} />
        <Route path="/emotion" element={token ? <Emotion /> : <Navigate to="/login" />} />
        <Route path="/recommend" element={token ? <Recommend /> : <Navigate to="/login" />} />
        <Route path="/analytics" element={token ? <Analytics /> : <Navigate to="/login" />} />  {/* NEW */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;