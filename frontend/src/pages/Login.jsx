import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setError("Please enter email and password.");
      return;
    }
    try {
      const res = await axios.post("http://localhost:5000/auth/login", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("name", res.data.name);
      // Hard navigate — forces App to re-evaluate token
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back 👋</h2>
        <p style={styles.sub}>Adaptive AI Learning Platform</p>
        {error && <p style={styles.error}>{error}</p>}
        <input
          style={styles.input}
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          style={styles.input}
          name="password"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={handleChange}
        />
        <button style={styles.btn} onClick={handleSubmit}>Login</button>
        <p style={styles.link} onClick={() => navigate("/signup")}>
          Don't have an account? Sign Up
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" },
  card: { background: "#fff", padding: "40px", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", width: "360px", display: "flex", flexDirection: "column", gap: "12px" },
  title: { margin: 0, fontSize: "24px", fontWeight: "600", color: "#1a1a2e" },
  sub: { margin: 0, fontSize: "13px", color: "#888" },
  input: { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none" },
  btn: { padding: "12px", borderRadius: "8px", background: "#6c63ff", color: "#fff", fontWeight: "600", border: "none", cursor: "pointer", fontSize: "15px" },
  error: { color: "red", fontSize: "13px", margin: 0, background: "#fff0f0", padding: "8px 12px", borderRadius: "8px" },
  link: { textAlign: "center", fontSize: "13px", color: "#6c63ff", cursor: "pointer" },
};