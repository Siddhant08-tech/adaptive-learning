import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const name = localStorage.getItem("name") || "Student";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    navigate("/login");
  };

  const cards = [
    { icon: "🎙️", label: "Upload Lecture",  desc: "Upload audio or video",       path: "/upload"     },
    { icon: "📝", label: "Speech to Text",  desc: "Transcribe your lecture",      path: "/transcribe" },
    { icon: "🗒️", label: "My Notes",        desc: "AI generated notes",           path: "/notes"      },
    { icon: "❓", label: "Take Quiz",        desc: "MCQ + short + long questions", path: "/quiz"       },
    { icon: "😊", label: "Emotion Status",  desc: "Real-time emotion detection",  path: "/emotion"    },
    { icon: "🎯", label: "Recommendations", desc: "Personalized study plan",      path: "/recommend"  },
    { icon: "📊", label: "Analytics",       desc: "Progress charts & insights",   path: "/analytics"  },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Hello, {name} 👋</h2>
          <p style={styles.sub}>Adaptive AI Learning Platform</p>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>

      <div style={styles.grid}>
        {cards.map((card) => (
          <div
            key={card.label}
            style={styles.card}
            onClick={() => navigate(card.path)}
          >
            <span style={styles.icon}>{card.icon}</span>
            <h3 style={styles.cardTitle}>{card.label}</h3>
            <p style={styles.cardDesc}>{card.desc}</p>
            <span style={styles.badge}>Ready ✅</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container:  { minHeight: "100vh", background: "#f0f4ff", padding: "32px" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" },
  title:      { margin: 0, fontSize: "26px", fontWeight: "700", color: "#1a1a2e" },
  sub:        { margin: "4px 0 0", fontSize: "13px", color: "#888" },
  logoutBtn:  { padding: "10px 20px", borderRadius: "8px", background: "#ff6b6b", color: "#fff", border: "none", cursor: "pointer", fontWeight: "600" },
  grid:       { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" },
  card:       { background: "#fff", borderRadius: "16px", padding: "28px 20px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", cursor: "pointer", transition: "transform 0.15s" },
  icon:       { fontSize: "36px" },
  cardTitle:  { margin: "12px 0 4px", fontSize: "15px", fontWeight: "600", color: "#1a1a2e" },
  cardDesc:   { margin: 0, fontSize: "12px", color: "#aaa" },
  badge:      { display: "inline-block", marginTop: "10px", fontSize: "11px", background: "#e8f5e9", color: "#388e3c", padding: "2px 10px", borderRadius: "20px", fontWeight: "600" },
};