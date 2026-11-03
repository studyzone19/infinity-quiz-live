import React, { useState } from "react";
import axios from "axios";
import { API_BASE } from "../config/api";
import { User, Mail, Sparkles, CheckCircle, Copy, ArrowRight, Download } from "lucide-react";

function Register({ onProceedToQuiz }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  // Validate Form
  const validateForm = () => {
    if (!form.name.trim()) return "Please enter your name";
    if (!form.email.trim()) return "Please enter your email";
    
    const emailPattern = /\S+@\S+\.\S+/;
    if (!emailPattern.test(form.email)) return "Please enter a valid email address";
    
    return "";
  };

  // Register User
  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();

    if (error) {
      setMessage(error);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      console.log("Registering contender via:", `${API_BASE}/api/register`, form);

      const response = await axios.post(
        `${API_BASE}/api/register`,
        form
      );

      console.log("Registration API Response:", response.data);
      setUserData(response.data);
      localStorage.setItem("lastUserId", response.data.userId);
    } catch (error) {
      console.error("Registration API Failure:", error);
      setMessage(error.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Copy User ID
  const handleCopy = () => {
    if (userData?.userId) {
      navigator.clipboard.writeText(userData.userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Download Game Pass as PNG
  const downloadGamePass = async () => {
    if (!userData) return;
    setDownloading(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const W = 480;
      const H = 680;
      const dpr = 2; // retina quality
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      // --- Background gradient ---
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, "#0a0e1a");
      bgGrad.addColorStop(0.5, "#111827");
      bgGrad.addColorStop(1, "#0a0e1a");
      ctx.fillStyle = bgGrad;
      roundRect(ctx, 0, 0, W, H, 28, true, false);

      // --- Decorative orb top-right ---
      const orbGrad1 = ctx.createRadialGradient(W - 60, 60, 0, W - 60, 60, 160);
      orbGrad1.addColorStop(0, "rgba(139, 92, 246, 0.25)");
      orbGrad1.addColorStop(1, "rgba(139, 92, 246, 0)");
      ctx.fillStyle = orbGrad1;
      ctx.fillRect(0, 0, W, H);

      // --- Decorative orb bottom-left ---
      const orbGrad2 = ctx.createRadialGradient(60, H - 60, 0, 60, H - 60, 140);
      orbGrad2.addColorStop(0, "rgba(6, 182, 212, 0.2)");
      orbGrad2.addColorStop(1, "rgba(6, 182, 212, 0)");
      ctx.fillStyle = orbGrad2;
      ctx.fillRect(0, 0, W, H);

      // --- Border ---
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1.5;
      roundRect(ctx, 1, 1, W - 2, H - 2, 28, false, true);

      // --- Top accent line gradient ---
      const accentGrad = ctx.createLinearGradient(40, 0, W - 40, 0);
      accentGrad.addColorStop(0, "rgba(139, 92, 246, 0)");
      accentGrad.addColorStop(0.5, "rgba(139, 92, 246, 0.8)");
      accentGrad.addColorStop(1, "rgba(6, 182, 212, 0)");
      ctx.strokeStyle = accentGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 12);
      ctx.lineTo(W - 40, 12);
      ctx.stroke();

      // --- Title ---
      let yPos = 48;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "600 11px 'Outfit', 'Segoe UI', sans-serif";
      ctx.letterSpacing = "3px";
      ctx.fillText("♾️  INFINITY QUIZ LIVE", W / 2, yPos);

      yPos += 30;
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 26px 'Outfit', 'Segoe UI', sans-serif";
      ctx.fillText("GAME ACCESS PASS", W / 2, yPos);

      // --- Divider ---
      yPos += 20;
      const divGrad = ctx.createLinearGradient(60, 0, W - 60, 0);
      divGrad.addColorStop(0, "rgba(139, 92, 246, 0)");
      divGrad.addColorStop(0.5, "rgba(139, 92, 246, 0.4)");
      divGrad.addColorStop(1, "rgba(6, 182, 212, 0)");
      ctx.strokeStyle = divGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, yPos);
      ctx.lineTo(W - 60, yPos);
      ctx.stroke();

      // --- QR Code ---
      yPos += 24;
      const qrSize = 200;
      const qrX = (W - qrSize - 24) / 2;
      const qrY = yPos;

      // QR white background with rounded corners
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, qrX, qrY, qrSize + 24, qrSize + 24, 16, true, false);

      // Draw QR image
      const qrImg = await loadImage(userData.qrCode);
      ctx.drawImage(qrImg, qrX + 12, qrY + 12, qrSize, qrSize);

      // --- User Info Section ---
      yPos = qrY + qrSize + 24 + 30;

      // Name label
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.font = "500 10px 'Outfit', 'Segoe UI', sans-serif";
      ctx.fillText("PLAYER NAME", W / 2, yPos);

      yPos += 22;
      ctx.fillStyle = "#f3f4f6";
      ctx.font = "700 20px 'Outfit', 'Segoe UI', sans-serif";
      ctx.fillText(form.name || "Player", W / 2, yPos);

      // Email label
      yPos += 32;
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.font = "500 10px 'Outfit', 'Segoe UI', sans-serif";
      ctx.fillText("EMAIL", W / 2, yPos);

      yPos += 20;
      ctx.fillStyle = "rgba(243, 244, 246, 0.75)";
      ctx.font = "500 14px 'Outfit', 'Segoe UI', sans-serif";
      ctx.fillText(form.email || "", W / 2, yPos);

      // --- Access ID badge ---
      yPos += 36;
      const badgeText = userData.userId;
      const badgeWidth = 220;
      const badgeHeight = 38;
      const badgeX = (W - badgeWidth) / 2;
      const badgeY = yPos - 24;

      // Badge background
      const badgeBgGrad = ctx.createLinearGradient(badgeX, 0, badgeX + badgeWidth, 0);
      badgeBgGrad.addColorStop(0, "rgba(139, 92, 246, 0.15)");
      badgeBgGrad.addColorStop(1, "rgba(6, 182, 212, 0.15)");
      ctx.fillStyle = badgeBgGrad;
      roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 10, true, false);

      // Badge border
      const badgeBorderGrad = ctx.createLinearGradient(badgeX, 0, badgeX + badgeWidth, 0);
      badgeBorderGrad.addColorStop(0, "rgba(139, 92, 246, 0.4)");
      badgeBorderGrad.addColorStop(1, "rgba(6, 182, 212, 0.4)");
      ctx.strokeStyle = badgeBorderGrad;
      ctx.lineWidth = 1;
      roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 10, false, true);

      // Badge text
      ctx.fillStyle = "#06b6d4";
      ctx.font = "700 15px 'JetBrains Mono', 'Fira Code', monospace";
      ctx.fillText(badgeText, W / 2, badgeY + 24);

      // --- Footer ---
      yPos = H - 28;
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.font = "400 10px 'Outfit', 'Segoe UI', sans-serif";
      ctx.fillText("Scan QR or use Access ID to join the live quiz", W / 2, yPos);

      // --- Download ---
      const link = document.createElement("a");
      link.download = `GamePass_${userData.userId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  // Reset Form
  const resetForm = () => {
    setForm({
      name: "",
      email: "",
    });
    setUserData(null);
    setMessage("");
  };

  return (
    <div className="glass-card">
      {!userData ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "12px" }}>
            <Sparkles size={28} style={{ color: "var(--color-secondary)", animation: "float 3s infinite ease-in-out" }} />
            <h1 className="brand-heading" style={{ margin: 0 }}>Game pass</h1>
          </div>
          <p className="brand-subheading">
            Register below to secure your unique live access pass. Your pass will be generated instantly as a secure QR Code.
          </p>

          {message && (
            <div className="toast">
              <span>⚠️ {message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-icon-wrapper">
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  disabled={loading}
                />
                <User size={18} className="input-icon" />
              </div>
            </div>

            <div className="form-group">
              <div className="input-icon-wrapper">
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  disabled={loading}
                />
                <Mail size={18} className="input-icon" />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "8px" }}>
              {loading ? "Generating Access Pass..." : "Register & Generate Pass"}
            </button>
          </form>
        </div>
      ) : (
        <div className="success-screen">
          <div className="success-icon-container">
            <CheckCircle size={32} />
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "8px" }}>Access Granted</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Your game profile is successfully registered. Scan this QR pass or use the User ID below to play the live quiz.
          </p>

          <div className="qr-code-wrapper">
            <img
              src={userData.qrCode}
              alt="Game QR Code"
              width="200"
              height="200"
            />
          </div>

          <h3>Your Access ID</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", margin: "8px 0" }}>
            <span className="user-id-badge">{userData.userId}</span>
            <button 
              onClick={handleCopy} 
              className="btn-secondary" 
              style={{ width: "auto", margin: 0, padding: "8px 12px", borderRadius: "10px" }}
              title="Copy Access ID"
            >
              <Copy size={16} />
              <span style={{ fontSize: "0.85rem" }}>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>

          <button
            onClick={downloadGamePass}
            className="btn-download-pass"
            disabled={downloading}
            style={{ marginTop: "20px" }}
          >
            <Download size={18} />
            <span>{downloading ? "Generating Image..." : "Download Game Pass (PNG)"}</span>
          </button>

          <button 
            onClick={() => onProceedToQuiz?.(userData.userId)} 
            className="btn-primary" 
            style={{ marginTop: "12px" }}
          >
            <span>Proceed to Quiz</span>
            <ArrowRight size={18} />
          </button>

          <button 
            onClick={resetForm} 
            className="btn-secondary"
          >
            Register Another Profile
          </button>
        </div>
      )}
    </div>
  );
}

// Helper: load an image from src and return a promise
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Helper: draw a rounded rectangle on canvas
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

export default Register;