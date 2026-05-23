import { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

export default function Transcribe() {
  const navigate = useNavigate();
  const location = useLocation();

  // If coming from UploadLecture, filename is passed via navigation state
  const passedFilename = location.state?.filename || "";

  const [filename, setFilename] = useState(passedFilename);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState(null);

  const handleTranscribe = async () => {
    if (!filename.trim()) {
      setStatus("❗ Please enter the uploaded filename.");
      return;
    }

    try {
      setLoading(true);
      setStatus("🎙️ Transcribing... this may take 1-2 minutes for long files.");
      setTranscript("");
      setMeta(null);

      const res = await axios.post("http://localhost:5000/ai/transcribe", {
        filename: filename.trim(),
      });

      setTranscript(res.data.transcript);
      setMeta({
        words: res.data.word_count,
        chars: res.data.char_count,
        file: res.data.transcript_file,
      });
      setStatus("✅ Transcription complete!");

      // Save transcript to localStorage so Notes page can use it
      localStorage.setItem("latest_transcript", res.data.transcript);
      localStorage.setItem("transcript_filename", res.data.transcript_file);

    } catch (err) {
      setStatus("❌ " + (err.response?.data?.error || "Transcription failed"));
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
          <h2 style={styles.title}>Speech to Text</h2>
          <p style={styles.sub}>Powered by OpenAI Whisper</p>
        </div>
      </div>

      {/* Input */}
      <div style={styles.card}>
        <label style={styles.label}>Uploaded filename (from Step 2)</label>
        <input
          style={styles.input}
          placeholder="e.g. a3f9c12d.mp3"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
        />
        <p style={styles.hint}>
          💡 Check your <code>backend/uploads/</code> folder for the filename after uploading.
        </p>
        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleTranscribe}
          disabled={loading}
        >
          {loading ? "Transcribing... ⏳" : "Start Transcription 🎙️"}
        </button>
      </div>

      {/* Status */}
      {status && <p style={styles.status}>{status}</p>}

      {/* Loading animation */}
      {loading && (
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Whisper is processing your audio...</p>
          <p style={styles.loadingSubText}>Longer files take more time. Please wait.</p>
        </div>
      )}

      {/* Meta info */}
      {meta && (
        <div style={styles.metaRow}>
          <span style={styles.metaBadge}>📝 {meta.words} words</span>
          <span style={styles.metaBadge}>🔤 {meta.chars} characters</span>
          <span style={styles.metaBadge}>💾 Saved as {meta.file}</span>
        </div>
      )}

      {/* Transcript output */}
      {transcript && (
        <div style={styles.transcriptCard}>
          <div style={styles.transcriptHeader}>
            <h3 style={styles.transcriptTitle}>📄 Transcript</h3>
            <button
              style={styles.copyBtn}
              onClick={() => { navigator.clipboard.writeText(transcript); alert("Copied!"); }}
            >
              Copy 📋
            </button>
          </div>
          <div style={styles.transcriptBox}>
            {transcript}
          </div>
          <div style={styles.nextStep}>
            <p style={styles.nextText}>
              🔜 Next: Go to <strong>Notes Generator</strong> to summarize this transcript automatically
            </p>
            <button style={styles.nextBtn} onClick={() => navigate("/notes")}>
              Generate Notes →
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
  container: { minHeight: "100vh", background: "#f0f4ff", padding: "32px", maxWidth: "700px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" },
  backBtn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "14px" },
  title: { margin: 0, fontSize: "24px", fontWeight: "700", color: "#1a1a2e" },
  sub: { margin: "4px 0 0", fontSize: "13px", color: "#888" },
  card: { background: "#fff", borderRadius: "16px", padding: "24px", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: "12px" },
  label: { fontSize: "14px", fontWeight: "600", color: "#444" },
  input: { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none" },
  hint: { margin: 0, fontSize: "12px", color: "#999" },
  btn: { padding: "13px", borderRadius: "10px", background: "#6c63ff", color: "#fff", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "15px" },
  status: { textAlign: "center", fontSize: "15px", fontWeight: "500", color: "#444", margin: "8px 0" },
  loadingCard: { background: "#fff", borderRadius: "16px", padding: "32px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: "20px" },
  spinner: { width: "40px", height: "40px", border: "4px solid #e0dbff", borderTop: "4px solid #6c63ff", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" },
  loadingText: { margin: "0 0 6px", fontSize: "15px", fontWeight: "600", color: "#444" },
  loadingSubText: { margin: 0, fontSize: "13px", color: "#aaa" },
  metaRow: { display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" },
  metaBadge: { background: "#e8f5e9", color: "#388e3c", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  transcriptCard: { background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  transcriptHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  transcriptTitle: { margin: 0, fontSize: "18px", fontWeight: "600" },
  copyBtn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", background: "#f9f9f9", cursor: "pointer", fontSize: "13px" },
  transcriptBox: { background: "#f7f7fb", borderRadius: "10px", padding: "20px", fontSize: "14px", lineHeight: "1.8", color: "#333", maxHeight: "300px", overflowY: "auto", whiteSpace: "pre-wrap" },
  nextStep: { background: "#f0f4ff", borderRadius: "10px", padding: "16px", marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  nextText: { margin: 0, fontSize: "13px", color: "#6c63ff" },
  nextBtn: { padding: "10px 20px", borderRadius: "8px", background: "#6c63ff", color: "#fff", fontWeight: "600", border: "none", cursor: "pointer", fontSize: "13px" },
};