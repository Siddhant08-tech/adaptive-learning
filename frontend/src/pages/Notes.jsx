import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Notes() {
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState(null);

  // Auto-load transcript from Step 3 if available
  useEffect(() => {
    const saved = localStorage.getItem("latest_transcript");
    if (saved) setTranscript(saved);
  }, []);

  const handleGenerate = async () => {
    if (!transcript.trim()) {
      setStatus("❗ Paste your transcript first.");
      return;
    }

    try {
      setLoading(true);
      setNotes(null);
      setStatus("🧠 Generating notes... this takes 1-2 minutes.");

      const res = await axios.post("http://localhost:5000/ai/generate-notes", {
        transcript: transcript.trim(),
      });

      setNotes(res.data);
      setStatus("✅ Notes ready!");

      // Save for Step 5 (Question Generator)
      localStorage.setItem("latest_summary", res.data.summary);
      localStorage.setItem("latest_keywords", JSON.stringify(res.data.keywords));

    } catch (err) {
      setStatus("❌ " + (err.response?.data?.error || "Failed to generate notes"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>← Back</button>
        <div>
          <h2 style={styles.title}>Notes Generator</h2>
          <p style={styles.sub}>Powered by HuggingFace Transformers</p>
        </div>
      </div>

      {/* Transcript Input */}
      <div style={styles.card}>
        <label style={styles.label}>
          Transcript {transcript ? `(${transcript.split(" ").length} words loaded ✅)` : "— paste below or complete Step 3 first"}
        </label>
        <textarea
          style={styles.textarea}
          placeholder="Paste your lecture transcript here..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
        />
        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Generating... 🧠" : "Generate Notes ✨"}
        </button>
      </div>

      {/* Status */}
      {status && <p style={styles.status}>{status}</p>}

      {/* Loading */}
      {loading && (
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>AI is reading your lecture...</p>
          <p style={styles.loadingSub}>Summarizing and extracting key points</p>
        </div>
      )}

      {/* Notes Output */}
      {notes && (
        <div style={styles.notesContainer}>

          {/* Summary */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📝 Summary</h3>
            <p style={styles.summaryText}>{notes.summary}</p>
          </div>

          {/* Key Points */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🔑 Key Points</h3>
            {notes.key_points.length > 0 ? (
              notes.key_points.map((point, i) => (
                <div key={i} style={styles.keyPoint}>
                  <span style={styles.pointNum}>{i + 1}</span>
                  <p style={styles.pointText}>{point}</p>
                </div>
              ))
            ) : (
              <p style={styles.empty}>No key points extracted</p>
            )}
          </div>

          {/* Keywords */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🏷️ Keywords</h3>
            <div style={styles.keywordsRow}>
              {notes.keywords.map((kw, i) => (
                <span key={i} style={styles.keyword}>{kw}</span>
              ))}
            </div>
          </div>

          {/* Next Step */}
          <div style={styles.nextStep}>
            <p style={styles.nextText}>🔜 Next: Generate quiz questions from these notes</p>
            <button style={styles.nextBtn} onClick={() => navigate("/quiz")}>
              Generate Quiz →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#f0f4ff", padding: "32px", maxWidth: "750px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" },
  backBtn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "14px" },
  title: { margin: 0, fontSize: "24px", fontWeight: "700", color: "#1a1a2e" },
  sub: { margin: "4px 0 0", fontSize: "13px", color: "#888" },
  card: { background: "#fff", borderRadius: "16px", padding: "24px", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: "12px" },
  label: { fontSize: "14px", fontWeight: "600", color: "#444" },
  textarea: { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: "1.6" },
  btn: { padding: "13px", borderRadius: "10px", background: "#6c63ff", color: "#fff", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "15px" },
  status: { textAlign: "center", fontSize: "15px", fontWeight: "500", color: "#444", margin: "8px 0" },
  loadingCard: { background: "#fff", borderRadius: "16px", padding: "32px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: "20px" },
  spinner: { width: "40px", height: "40px", border: "4px solid #e0dbff", borderTop: "4px solid #6c63ff", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" },
  loadingText: { margin: "0 0 6px", fontSize: "15px", fontWeight: "600", color: "#444" },
  loadingSub: { margin: 0, fontSize: "13px", color: "#aaa" },
  notesContainer: { display: "flex", flexDirection: "column", gap: "20px" },
  section: { background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  sectionTitle: { margin: "0 0 16px", fontSize: "18px", fontWeight: "600", color: "#1a1a2e" },
  summaryText: { margin: 0, fontSize: "15px", lineHeight: "1.8", color: "#333" },
  keyPoint: { display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" },
  pointNum: { background: "#6c63ff", color: "#fff", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", flexShrink: 0, paddingTop: "1px" },
  pointText: { margin: 0, fontSize: "14px", lineHeight: "1.7", color: "#444" },
  empty: { color: "#aaa", fontSize: "14px" },
  keywordsRow: { display: "flex", flexWrap: "wrap", gap: "8px" },
  keyword: { background: "#f0f4ff", color: "#6c63ff", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" },
  nextStep: { background: "#f0f4ff", borderRadius: "12px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  nextText: { margin: 0, fontSize: "13px", color: "#6c63ff", fontWeight: "500" },
  nextBtn: { padding: "10px 20px", borderRadius: "8px", background: "#6c63ff", color: "#fff", fontWeight: "600", border: "none", cursor: "pointer", fontSize: "13px" },
};