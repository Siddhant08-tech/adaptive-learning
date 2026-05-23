import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Emotion() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const [streaming, setStreaming] = useState(false);
  const [emotion, setEmotion] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [detecting, setDetecting] = useState(false);

  // Start webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setStreaming(true);
      setError("");
    } catch (err) {
      setError("❌ Camera access denied. Please allow camera permission.");
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStreaming(false);
    setDetecting(false);
  };

  // Capture one frame and send to backend
  const captureAndDetect = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.7);

    try {
      const res = await axios.post("http://localhost:5000/ai/detect-emotion", {
        image: imageData,
      });

      const result = res.data;
      setEmotion(result);

      // Add to history (keep last 10)
      setHistory((prev) => [
        { ...result, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ]);

      // Save latest emotion for recommendation engine
      localStorage.setItem("latest_emotion", result.dominant_emotion);
      localStorage.setItem("latest_learning_state", result.learning_state);

    } catch (err) {
      console.error("Detection error:", err.message);
    }
  }, []);

  // Start auto-detection every 4 seconds
  const startDetection = () => {
    setDetecting(true);
    captureAndDetect();
    intervalRef.current = setInterval(captureAndDetect, 4000);
  };

  const stopDetection = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDetecting(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => { stopCamera(); navigate("/dashboard"); }}>← Back</button>
        <div>
          <h2 style={styles.title}>Emotion Detection</h2>
          <p style={styles.sub}>Real-time learning state via webcam · DeepFace + OpenCV</p>
        </div>
      </div>

      <div style={styles.layout}>
        {/* Left — Camera */}
        <div style={styles.cameraSection}>
          <div style={styles.videoWrapper}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={styles.video}
            />
            {!streaming && (
              <div style={styles.videoPlaceholder}>
                <span style={styles.camIcon}>📷</span>
                <p style={styles.camText}>Camera not started</p>
              </div>
            )}
            {/* Overlay border based on emotion color */}
            {emotion && (
              <div style={{ ...styles.emotionBorder, borderColor: emotion.color }} />
            )}
          </div>

          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Camera Controls */}
          <div style={styles.controls}>
            {!streaming ? (
              <button style={styles.startBtn} onClick={startCamera}>
                📷 Start Camera
              </button>
            ) : (
              <>
                {!detecting ? (
                  <button style={styles.detectBtn} onClick={startDetection}>
                    🔍 Start Detection
                  </button>
                ) : (
                  <button style={styles.stopDetectBtn} onClick={stopDetection}>
                    ⏸ Pause Detection
                  </button>
                )}
                <button style={styles.stopBtn} onClick={stopCamera}>
                  ⏹ Stop Camera
                </button>
              </>
            )}
          </div>

          {error && <p style={styles.error}>{error}</p>}

          {detecting && (
            <p style={styles.detectingBadge}>🔴 Live — detecting every 4 seconds</p>
          )}
        </div>

        {/* Right — Results */}
        <div style={styles.resultsSection}>

          {/* Current Emotion Card */}
          {emotion ? (
            <div style={{ ...styles.emotionCard, borderLeft: `5px solid ${emotion.color}` }}>
              <div style={styles.emotionTop}>
                <span style={styles.emotionEmoji}>{emotion.emoji}</span>
                <div>
                  <p style={styles.emotionState}>{emotion.learning_state}</p>
                  <p style={styles.emotionRaw}>Detected: {emotion.dominant_emotion}</p>
                </div>
              </div>
              <p style={{ ...styles.emotionTip, background: emotion.color + "18", color: emotion.color }}>
                💡 {emotion.tip}
              </p>

              {/* Emotion score bars */}
              <div style={styles.barsSection}>
                <p style={styles.barsTitle}>Emotion Scores</p>
                {Object.entries(emotion.all_scores)
                  .sort((a, b) => b[1] - a[1])
                  .map(([emo, score]) => (
                    <div key={emo} style={styles.barRow}>
                      <span style={styles.barLabel}>{emo}</span>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, width: `${score}%`, background: emotion.color }} />
                      </div>
                      <span style={styles.barScore}>{score}%</span>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div style={styles.emptyCard}>
              <span style={styles.emptyIcon}>😶</span>
              <p style={styles.emptyText}>Start camera and detection to see your emotion</p>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div style={styles.historyCard}>
              <p style={styles.historyTitle}>📊 Detection History</p>
              {history.map((h, i) => (
                <div key={i} style={styles.historyRow}>
                  <span style={styles.historyEmoji}>{h.emoji}</span>
                  <span style={styles.historyState}>{h.learning_state}</span>
                  <span style={styles.historyTime}>{h.time}</span>
                </div>
              ))}
            </div>
          )}

          {/* Next Step */}
          <div style={styles.nextStep}>
            <p style={styles.nextText}>🔜 Next: Get personalized recommendations</p>
            <button style={styles.nextBtn} onClick={() => { stopCamera(); navigate("/recommend"); }}>
              Recommendations →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#f0f4ff", padding: "28px", maxWidth: "1100px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" },
  backBtn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "14px", whiteSpace: "nowrap" },
  title: { margin: 0, fontSize: "24px", fontWeight: "700", color: "#1a1a2e" },
  sub: { margin: "4px 0 0", fontSize: "13px", color: "#888" },
  layout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  cameraSection: { display: "flex", flexDirection: "column", gap: "16px" },
  videoWrapper: { position: "relative", borderRadius: "16px", overflow: "hidden", background: "#1a1a2e", aspectRatio: "4/3" },
  video: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  videoPlaceholder: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  camIcon: { fontSize: "48px", marginBottom: "12px" },
  camText: { color: "#888", fontSize: "14px" },
  emotionBorder: { position: "absolute", inset: 0, border: "4px solid", borderRadius: "16px", pointerEvents: "none", transition: "border-color 0.5s" },
  controls: { display: "flex", gap: "10px", flexWrap: "wrap" },
  startBtn: { flex: 1, padding: "12px", borderRadius: "10px", background: "#6c63ff", color: "#fff", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "14px" },
  detectBtn: { flex: 1, padding: "12px", borderRadius: "10px", background: "#4caf50", color: "#fff", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "14px" },
  stopDetectBtn: { flex: 1, padding: "12px", borderRadius: "10px", background: "#ff9800", color: "#fff", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "14px" },
  stopBtn: { flex: 1, padding: "12px", borderRadius: "10px", background: "#f44336", color: "#fff", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "14px" },
  error: { color: "#f44336", fontSize: "13px", margin: 0 },
  detectingBadge: { textAlign: "center", fontSize: "13px", color: "#f44336", fontWeight: "600", margin: 0 },
  resultsSection: { display: "flex", flexDirection: "column", gap: "16px" },
  emotionCard: { background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  emotionTop: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px" },
  emotionEmoji: { fontSize: "52px" },
  emotionState: { margin: 0, fontSize: "22px", fontWeight: "700", color: "#1a1a2e" },
  emotionRaw: { margin: "4px 0 0", fontSize: "13px", color: "#888", textTransform: "capitalize" },
  emotionTip: { padding: "10px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: "500", margin: "0 0 16px" },
  barsSection: { display: "flex", flexDirection: "column", gap: "8px" },
  barsTitle: { margin: "0 0 8px", fontSize: "13px", fontWeight: "600", color: "#666" },
  barRow: { display: "flex", alignItems: "center", gap: "10px" },
  barLabel: { fontSize: "12px", color: "#666", width: "70px", textTransform: "capitalize" },
  barTrack: { flex: 1, background: "#eee", borderRadius: "6px", height: "8px", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: "6px", transition: "width 0.4s" },
  barScore: { fontSize: "12px", color: "#888", width: "36px", textAlign: "right" },
  emptyCard: { background: "#fff", borderRadius: "16px", padding: "40px 20px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  emptyIcon: { fontSize: "48px", display: "block", marginBottom: "12px" },
  emptyText: { margin: 0, fontSize: "14px", color: "#aaa" },
  historyCard: { background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  historyTitle: { margin: "0 0 12px", fontSize: "14px", fontWeight: "600", color: "#444" },
  historyRow: { display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid #f5f5f5" },
  historyEmoji: { fontSize: "20px" },
  historyState: { flex: 1, fontSize: "13px", fontWeight: "500", color: "#333" },
  historyTime: { fontSize: "12px", color: "#aaa" },
  nextStep: { background: "#f0f4ff", borderRadius: "12px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  nextText: { margin: 0, fontSize: "13px", color: "#6c63ff", fontWeight: "500" },
  nextBtn: { padding: "10px 20px", borderRadius: "8px", background: "#6c63ff", color: "#fff", fontWeight: "600", border: "none", cursor: "pointer", fontSize: "13px" },
};