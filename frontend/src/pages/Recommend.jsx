import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Recommend() {
  const navigate = useNavigate();

  const [score,   setScore]   = useState(localStorage.getItem("quiz_score")    || "0");
  const [emotion, setEmotion] = useState(localStorage.getItem("latest_emotion") || "neutral");
  const [keywords, setKeywords] = useState([]);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("latest_keywords");
    if (saved) {
      try { setKeywords(JSON.parse(saved)); } catch {}
    }
  }, []);

  const handleGetRecommendation = async () => {
    try {
      setLoading(true);
      setResult(null);
      setStatus("🧠 Analyzing your learning data...");

      const res = await axios.post("http://localhost:5000/ai/recommend", {
        score:    parseInt(score),
        emotion:  emotion,
        keywords: keywords,
      });

      setResult(res.data);
      setStatus("");
    } catch (err) {
      setStatus("❌ " + (err.response?.data?.error || "Failed to get recommendation"));
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on page load if data is available
  useEffect(() => {
    if (score || emotion) handleGetRecommendation();
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>← Back</button>
        <div>
          <h2 style={styles.title}>Recommendation Engine</h2>
          <p style={styles.sub}>Personalized suggestions based on your emotion + quiz score</p>
        </div>
      </div>

      {/* Input Panel */}
      <div style={styles.inputCard}>
        <h3 style={styles.inputTitle}>Your Learning Data</h3>
        <div style={styles.inputRow}>

          {/* Score */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Quiz Score (%)</label>
            <input
              style={styles.input}
              type="number"
              min="0" max="100"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>

          {/* Emotion */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Current Emotion</label>
            <select
              style={styles.input}
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
            >
              {["happy", "neutral", "sad", "angry", "fear", "disgust", "surprise"].map((e) => (
                <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Keywords */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Weak Topics (auto-detected)</label>
            <input
              style={styles.input}
              value={keywords.slice(0, 3).join(", ")}
              readOnly
              placeholder="Complete Step 4 first"
            />
          </div>
        </div>

        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleGetRecommendation}
          disabled={loading}
        >
          {loading ? "Analyzing... 🧠" : "Get My Recommendation 🎯"}
        </button>
      </div>

      {status && <p style={styles.status}>{status}</p>}

      {/* Result */}
      {result && (
        <div style={styles.resultContainer}>

          {/* Main Card */}
          <div style={{ ...styles.mainCard, borderTop: `6px solid ${result.color}` }}>
            <div style={styles.mainTop}>
              <span style={styles.mainEmoji}>{result.emoji}</span>
              <div>
                <h2 style={styles.mainTitle}>{result.title}</h2>
                <p style={styles.mainSummary}>{result.summary}</p>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <h3 style={styles.actionsTitle}>📋 Your Action Plan</h3>
          <div style={styles.actionsGrid}>
            {result.actions.map((action, i) => (
              <div key={i} style={{ ...styles.actionCard, borderLeft: `4px solid ${result.color}` }}>
                <span style={styles.actionIcon}>{action.icon}</span>
                <div>
                  <p style={styles.actionLabel}>{action.label}</p>
                  <p style={styles.actionDesc}>{action.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Weak Topics */}
          {result.weak_topics?.length > 0 && (
            <div style={styles.weakCard}>
              <p style={styles.weakTitle}>🔍 Topics to Focus On</p>
              <div style={styles.weakRow}>
                {result.weak_topics.map((t, i) => (
                  <span key={i} style={{ ...styles.weakBadge, background: result.color + "22", color: result.color }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Score + Emotion Summary */}
          <div style={styles.summaryRow}>
            <div style={styles.summaryBox}>
              <p style={styles.summaryLabel}>Quiz Score</p>
              <p style={{ ...styles.summaryValue, color: result.color }}>{score}%</p>
            </div>
            <div style={styles.summaryBox}>
              <p style={styles.summaryLabel}>Emotion</p>
              <p style={{ ...styles.summaryValue, color: result.color }}>
                {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
              </p>
            </div>
            <div style={styles.summaryBox}>
              <p style={styles.summaryLabel}>Learning Case</p>
              <p style={{ ...styles.summaryValue, color: result.color, fontSize: "14px" }}>
                {result.case.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          {/* Next Step */}
          <div style={styles.nextStep}>
            <p style={styles.nextText}>🔜 Last step: View your Analytics Dashboard</p>
            <button style={styles.nextBtn} onClick={() => navigate("/dashboard")}>
              Back to Dashboard →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container:      { minHeight: "100vh", background: "#f0f4ff", padding: "32px", maxWidth: "820px", margin: "0 auto" },
  header:         { display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" },
  backBtn:        { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "14px", whiteSpace: "nowrap" },
  title:          { margin: 0, fontSize: "24px", fontWeight: "700", color: "#1a1a2e" },
  sub:            { margin: "4px 0 0", fontSize: "13px", color: "#888" },
  inputCard:      { background: "#fff", borderRadius: "16px", padding: "24px", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  inputTitle:     { margin: "0 0 16px", fontSize: "16px", fontWeight: "600", color: "#1a1a2e" },
  inputRow:       { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" },
  inputGroup:     { display: "flex", flexDirection: "column", gap: "6px" },
  label:          { fontSize: "13px", fontWeight: "600", color: "#555" },
  input:          { padding: "10px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none" },
  btn:            { width: "100%", padding: "13px", borderRadius: "10px", background: "#6c63ff", color: "#fff", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "15px" },
  status:         { textAlign: "center", fontSize: "14px", color: "#666", margin: "8px 0" },
  resultContainer:{ display: "flex", flexDirection: "column", gap: "20px" },
  mainCard:       { background: "#fff", borderRadius: "16px", padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  mainTop:        { display: "flex", gap: "20px", alignItems: "flex-start" },
  mainEmoji:      { fontSize: "56px", lineHeight: 1 },
  mainTitle:      { margin: "0 0 10px", fontSize: "22px", fontWeight: "700", color: "#1a1a2e" },
  mainSummary:    { margin: 0, fontSize: "15px", lineHeight: "1.7", color: "#555" },
  actionsTitle:   { margin: "0", fontSize: "16px", fontWeight: "600", color: "#1a1a2e" },
  actionsGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  actionCard:     { background: "#fff", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", gap: "14px", alignItems: "flex-start" },
  actionIcon:     { fontSize: "28px", lineHeight: 1 },
  actionLabel:    { margin: "0 0 4px", fontSize: "14px", fontWeight: "600", color: "#1a1a2e" },
  actionDesc:     { margin: 0, fontSize: "12px", color: "#777", lineHeight: "1.5" },
  weakCard:       { background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  weakTitle:      { margin: "0 0 12px", fontSize: "14px", fontWeight: "600", color: "#444" },
  weakRow:        { display: "flex", gap: "10px", flexWrap: "wrap" },
  weakBadge:      { padding: "6px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" },
  summaryRow:     { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" },
  summaryBox:     { background: "#fff", borderRadius: "12px", padding: "20px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  summaryLabel:   { margin: "0 0 8px", fontSize: "12px", color: "#888", fontWeight: "500" },
  summaryValue:   { margin: 0, fontSize: "22px", fontWeight: "700" },
  nextStep:       { background: "#f0f4ff", borderRadius: "12px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  nextText:       { margin: 0, fontSize: "13px", color: "#6c63ff", fontWeight: "500" },
  nextBtn:        { padding: "10px 20px", borderRadius: "8px", background: "#6c63ff", color: "#fff", fontWeight: "600", border: "none", cursor: "pointer", fontSize: "13px" },
};