import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Quiz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [activeTab, setActiveTab] = useState("mcq");

  const handleGenerate = async () => {
    const transcript = localStorage.getItem("latest_transcript") || "";
    const summary = localStorage.getItem("latest_summary") || "";

    if (!transcript && !summary) {
      setStatus("❗ Please complete Step 3 (Speech to Text) first.");
      return;
    }

    try {
      setLoading(true);
      setQuiz(null);
      setAnswers({});
      setSubmitted(false);
      setScore(null);
      setStatus("🧠 Generating questions...");

      const res = await axios.post("http://localhost:5000/ai/generate-quiz", {
        transcript,
        summary,
      });

      setQuiz(res.data);
      setStatus(`✅ ${res.data.total} questions generated!`);

      // Save score context for Step 7
      localStorage.setItem("quiz_total", res.data.mcqs.length);

    } catch (err) {
      setStatus("❌ " + (err.response?.data?.error || "Failed to generate quiz"));
    } finally {
      setLoading(false);
    }
  };

  const handleMCQAnswer = (qIndex, label) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: label }));
  };

  const handleSubmit = () => {
    if (!quiz) return;
    let correct = 0;
    quiz.mcqs.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    const pct = Math.round((correct / quiz.mcqs.length) * 100);
    setScore({ correct, total: quiz.mcqs.length, percent: pct });
    setSubmitted(true);

    // Save for recommendation engine Step 7
    localStorage.setItem("quiz_score", pct);
    localStorage.setItem("quiz_correct", correct);
  };

  const getOptionStyle = (q, i, label) => {
    if (!submitted) {
      return answers[i] === label ? styles.optionSelected : styles.option;
    }
    if (label === q.answer) return styles.optionCorrect;
    if (answers[i] === label && label !== q.answer) return styles.optionWrong;
    return styles.option;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>← Back</button>
        <div>
          <h2 style={styles.title}>Quiz Generator</h2>
          <p style={styles.sub}>AI-generated MCQs, Short & Long Questions</p>
        </div>
      </div>

      {/* Generate Button */}
      {!quiz && (
        <div style={styles.card}>
          <p style={styles.label}>Questions will be generated from your lecture transcript automatically.</p>
          <button
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating... 🧠" : "Generate Quiz ❓"}
          </button>
        </div>
      )}

      {status && <p style={styles.status}>{status}</p>}

      {/* Loading */}
      {loading && (
        <div style={styles.loadingCard}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Analyzing your lecture content...</p>
        </div>
      )}

      {/* Quiz Content */}
      {quiz && (
        <>
          {/* Tabs */}
          <div style={styles.tabs}>
            {["mcq", "short", "long"].map((tab) => (
              <button
                key={tab}
                style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "mcq" ? `MCQ (${quiz.mcqs.length})` : tab === "short" ? `Short (${quiz.short_questions.length})` : `Long (${quiz.long_questions.length})`}
              </button>
            ))}
          </div>

          {/* MCQ Tab */}
          {activeTab === "mcq" && (
            <div style={styles.section}>
              {quiz.mcqs.length === 0 ? (
                <p style={styles.empty}>Not enough content to generate MCQs. Try a longer transcript.</p>
              ) : (
                <>
                  {quiz.mcqs.map((q, i) => (
                    <div key={i} style={styles.questionCard}>
                      <p style={styles.questionText}>
                        <strong>Q{i + 1}.</strong> {q.question}
                      </p>
                      <div style={styles.optionsGrid}>
                        {Object.entries(q.options).map(([label, text]) => (
                          <div
                            key={label}
                            style={getOptionStyle(q, i, label)}
                            onClick={() => handleMCQAnswer(i, label)}
                          >
                            <span style={styles.optionLabel}>{label}</span>
                            <span style={styles.optionText}>{text}</span>
                          </div>
                        ))}
                      </div>
                      {submitted && (
                        <p style={styles.answerReveal}>
                          ✅ Correct answer: <strong>{q.answer}. {q.answer_text}</strong>
                        </p>
                      )}
                    </div>
                  ))}

                  {!submitted ? (
                    <button style={styles.submitBtn} onClick={handleSubmit}>
                      Submit Answers ✅
                    </button>
                  ) : (
                    <div style={styles.scoreCard}>
                      <h3 style={styles.scoreTitle}>Your Score</h3>
                      <p style={styles.scoreNum}>{score.correct} / {score.total}</p>
                      <div style={styles.scoreBar}>
                        <div style={{ ...styles.scoreBarFill, width: `${score.percent}%`, background: score.percent >= 70 ? "#4caf50" : score.percent >= 40 ? "#ff9800" : "#f44336" }} />
                      </div>
                      <p style={styles.scorePct}>{score.percent}%</p>
                      <p style={styles.scoreMsg}>
                        {score.percent >= 70 ? "🎉 Great job! You know this topic well." : score.percent >= 40 ? "📚 Good effort! Review the weak areas." : "💪 Keep studying! Check the recommendations."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Short Questions Tab */}
          {activeTab === "short" && (
            <div style={styles.section}>
              {quiz.short_questions.map((q, i) => (
                <div key={i} style={styles.questionCard}>
                  <p style={styles.questionText}><strong>Q{i + 1}.</strong> {q.question}</p>
                  <p style={styles.hint}>💡 {q.hint}</p>
                  <textarea style={styles.answerBox} placeholder="Write your answer here..." rows={3} />
                </div>
              ))}
            </div>
          )}

          {/* Long Questions Tab */}
          {activeTab === "long" && (
            <div style={styles.section}>
              {quiz.long_questions.map((q, i) => (
                <div key={i} style={styles.questionCard}>
                  <p style={styles.questionText}><strong>Q{i + 1}.</strong> {q.question}</p>
                  <p style={styles.hint}>💡 {q.hint}</p>
                  <textarea style={styles.answerBox} placeholder="Write a detailed answer here..." rows={6} />
                </div>
              ))}
            </div>
          )}

          {/* Next Step */}
          <div style={styles.nextStep}>
            <p style={styles.nextText}>🔜 Next: Set up Emotion Detection</p>
            <button style={styles.nextBtn} onClick={() => navigate("/emotion")}>
              Emotion Detection →
            </button>
          </div>
        </>
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
  container: { minHeight: "100vh", background: "#f0f4ff", padding: "32px", maxWidth: "780px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" },
  backBtn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "14px" },
  title: { margin: 0, fontSize: "24px", fontWeight: "700", color: "#1a1a2e" },
  sub: { margin: "4px 0 0", fontSize: "13px", color: "#888" },
  card: { background: "#fff", borderRadius: "16px", padding: "24px", marginBottom: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: "12px" },
  label: { margin: 0, fontSize: "14px", color: "#666" },
  btn: { padding: "13px", borderRadius: "10px", background: "#6c63ff", color: "#fff", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "15px" },
  status: { textAlign: "center", fontSize: "15px", fontWeight: "500", color: "#444", margin: "8px 0" },
  loadingCard: { background: "#fff", borderRadius: "16px", padding: "32px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: "20px" },
  spinner: { width: "40px", height: "40px", border: "4px solid #e0dbff", borderTop: "4px solid #6c63ff", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 1s linear infinite" },
  loadingText: { margin: 0, fontSize: "15px", fontWeight: "600", color: "#444" },
  tabs: { display: "flex", gap: "8px", marginBottom: "20px" },
  tab: { padding: "10px 20px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: "500", color: "#666" },
  tabActive: { background: "#6c63ff", color: "#fff", border: "1px solid #6c63ff" },
  section: { display: "flex", flexDirection: "column", gap: "16px" },
  questionCard: { background: "#fff", borderRadius: "14px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" },
  questionText: { margin: "0 0 14px", fontSize: "15px", lineHeight: "1.6", color: "#1a1a2e" },
  optionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  option: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", border: "1px solid #eee", cursor: "pointer", transition: "all 0.15s" },
  optionSelected: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", border: "1px solid #6c63ff", background: "#f0f0ff", cursor: "pointer" },
  optionCorrect: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", border: "1px solid #4caf50", background: "#e8f5e9", cursor: "default" },
  optionWrong: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "8px", border: "1px solid #f44336", background: "#ffebee", cursor: "default" },
  optionLabel: { fontWeight: "700", fontSize: "13px", color: "#6c63ff", minWidth: "18px" },
  optionText: { fontSize: "13px", color: "#333" },
  answerReveal: { margin: "12px 0 0", fontSize: "13px", color: "#388e3c", background: "#e8f5e9", padding: "8px 12px", borderRadius: "8px" },
  submitBtn: { padding: "13px", borderRadius: "10px", background: "#4caf50", color: "#fff", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "15px", marginTop: "8px" },
  scoreCard: { background: "#fff", borderRadius: "14px", padding: "28px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginTop: "8px" },
  scoreTitle: { margin: "0 0 8px", fontSize: "18px", fontWeight: "600" },
  scoreNum: { margin: "0 0 16px", fontSize: "42px", fontWeight: "700", color: "#6c63ff" },
  scoreBar: { background: "#eee", borderRadius: "10px", height: "12px", margin: "0 auto 8px", maxWidth: "300px", overflow: "hidden" },
  scoreBarFill: { height: "100%", borderRadius: "10px", transition: "width 0.5s" },
  scorePct: { margin: "0 0 12px", fontSize: "20px", fontWeight: "600", color: "#444" },
  scoreMsg: { margin: 0, fontSize: "15px", color: "#666" },
  hint: { margin: "0 0 10px", fontSize: "12px", color: "#888", fontStyle: "italic" },
  answerBox: { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" },
  empty: { color: "#aaa", fontSize: "14px", textAlign: "center", padding: "20px" },
  nextStep: { background: "#f0f4ff", borderRadius: "12px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginTop: "24px" },
  nextText: { margin: 0, fontSize: "13px", color: "#6c63ff", fontWeight: "500" },
  nextBtn: { padding: "10px 20px", borderRadius: "8px", background: "#6c63ff", color: "#fff", fontWeight: "600", border: "none", cursor: "pointer", fontSize: "13px" },
};