import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function UploadLecture() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus("❗ Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setStatus("Uploading...");
      const res = await axios.post("http://localhost:5000/lecture/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadedFile(res.data);
      setStatus("✅ Upload successful!");
    } catch (err) {
      setStatus("❌ " + (err.response?.data?.error || "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>← Back</button>
        <div>
          <h2 style={styles.title}>Upload Lecture</h2>
          <p style={styles.sub}>Supports MP3, MP4, WAV, M4A</p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        style={{ ...styles.dropZone, ...(dragOver ? styles.dropZoneActive : {}) }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("fileInput").click()}
      >
        <span style={styles.dropIcon}>🎙️</span>
        {file ? (
          <>
            <p style={styles.fileName}>{file.name}</p>
            <p style={styles.fileSize}>{formatSize(file.size)}</p>
          </>
        ) : (
          <>
            <p style={styles.dropText}>Drag & drop your lecture file here</p>
            <p style={styles.dropSub}>or click to browse</p>
          </>
        )}
        <input
          id="fileInput"
          type="file"
          accept=".mp3,.mp4,.wav,.m4a,.webm"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {/* Upload Button */}
      <button
        style={{ ...styles.uploadBtn, opacity: uploading ? 0.7 : 1 }}
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload Lecture ⬆️"}
      </button>

      {/* Status Message */}
      {status && <p style={styles.status}>{status}</p>}

      {/* Success Card */}
      {uploadedFile && (
        <div style={styles.successCard}>
          <h3 style={styles.successTitle}>📁 File Uploaded</h3>
          <p style={styles.successRow}><strong>Original name:</strong> {uploadedFile.original_name}</p>
          <p style={styles.successRow}><strong>Saved as:</strong> {uploadedFile.filename}</p>
          <p style={styles.successRow}><strong>Location:</strong> backend/uploads/</p>
          <div style={styles.nextStep}>
            <p style={styles.nextText}>🔜 Next step: This file will be sent to Whisper for transcription in Step 3</p>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#f0f4ff", padding: "32px", maxWidth: "600px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" },
  backBtn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontSize: "14px" },
  title: { margin: 0, fontSize: "24px", fontWeight: "700", color: "#1a1a2e" },
  sub: { margin: "4px 0 0", fontSize: "13px", color: "#888" },
  dropZone: { border: "2px dashed #c0b4ff", borderRadius: "16px", background: "#fff", padding: "48px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", marginBottom: "20px" },
  dropZoneActive: { borderColor: "#6c63ff", background: "#f3f0ff" },
  dropIcon: { fontSize: "48px", display: "block", marginBottom: "12px" },
  dropText: { margin: "0 0 4px", fontSize: "16px", fontWeight: "500", color: "#444" },
  dropSub: { margin: 0, fontSize: "13px", color: "#aaa" },
  fileName: { margin: "0 0 4px", fontSize: "16px", fontWeight: "600", color: "#6c63ff" },
  fileSize: { margin: 0, fontSize: "13px", color: "#888" },
  uploadBtn: { width: "100%", padding: "14px", borderRadius: "10px", background: "#6c63ff", color: "#fff", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "16px", marginBottom: "16px" },
  status: { textAlign: "center", fontSize: "15px", fontWeight: "500", color: "#444" },
  successCard: { background: "#fff", borderRadius: "16px", padding: "24px", marginTop: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  successTitle: { margin: "0 0 16px", fontSize: "18px", fontWeight: "600" },
  successRow: { margin: "8px 0", fontSize: "14px", color: "#444" },
  nextStep: { background: "#f0f4ff", borderRadius: "10px", padding: "14px", marginTop: "16px" },
  nextText: { margin: 0, fontSize: "13px", color: "#6c63ff", fontWeight: "500" },
};