import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config/api";
import Quiz from "./Quiz";
import TrueFalse from "./TrueFalse";
import Unscramble from "./Unscramble";
import { QrCode, Lock, ShieldAlert, Trophy } from "lucide-react";

export default function KioskStation({ targetGame, gameName }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [passId, setPassId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [scanError, setScanError] = useState("");
  
  const [gameStarted, setGameStarted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [lastScore, setLastScore] = useState(0);

  // Auto-verify from URL ?id= param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idFromUrl = params.get("id");
    if (idFromUrl) {
      setPassId(idFromUrl);
      autoVerify(idFromUrl);
    } else {
      const saved = localStorage.getItem("lastUserId");
      if (saved) setPassId(saved);
    }
  }, [location.search]);

  const autoVerify = async (id) => {
    try {
      setVerifying(true);
      setScanError("");
      const response = await axios.post(`${API_BASE}/api/verify`, { userId: id.trim() });
      setVerifiedUser(response.data.user);
      
      // Auto start game
      setGameStarted(true);
    } catch (err) {
      setScanError(err.response?.data?.error || "Access pass invalid or not registered.");
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!passId.trim()) return;
    await autoVerify(passId);
  };

  const handleGameFinished = (score) => {
    setLastScore(score);
    setGameStarted(false);
    setShowLeaderboard(true);
  };

  const resetKiosk = () => {
    setVerifiedUser(null);
    setGameStarted(false);
    setShowLeaderboard(false);
    setPassId("");
    localStorage.removeItem("lastUserId");
    navigate(location.pathname); // reset URL params if any
  };

  // Show Game Component
  if (verifiedUser && gameStarted) {
    if (targetGame === "quiz" || targetGame === "speed") {
      return <Quiz user={verifiedUser} onExit={handleGameFinished} gameType={targetGame} />;
    }
    if (targetGame === "truefalse") {
      return <TrueFalse user={verifiedUser} onExit={handleGameFinished} />;
    }
    if (targetGame === "unscramble") {
      return <Unscramble user={verifiedUser} onExit={handleGameFinished} />;
    }
  }

  // Show Leaderboard after game finishes
  if (verifiedUser && showLeaderboard) {
    return (
      <div className="glass-card" style={{ maxWidth: "600px" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <Trophy size={48} style={{ color: "var(--color-primary)", margin: "0 auto 10px" }} />
          <h2>Game Over!</h2>
          <p>You scored <strong>{lastScore}</strong> points.</p>
        </div>
        
        {/* Simple button to redirect to specific game leaderboard */}
        <button onClick={() => navigate(`/leaderboard/${targetGame}`)} className="btn-primary" style={{ marginBottom: "12px" }}>
          View {gameName} Leaderboard
        </button>
        <button onClick={resetKiosk} className="btn-secondary" style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "12px" }}>
          Next Player
        </button>
      </div>
    );
  }

  // ── Enter Pass Form ──
  return (
    <div className="glass-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "12px" }}>
        <QrCode size={28} style={{ color: "var(--color-secondary)", animation: "float 3s infinite ease-in-out" }} />
        <h1 className="brand-heading" style={{ margin: 0 }}>{gameName} Station</h1>
      </div>
      <p className="brand-subheading">
        Scan your pass to play {gameName}.
      </p>

      {scanError && (
        <div className="toast">
          <ShieldAlert size={18} />
          <span>{scanError}</span>
        </div>
      )}

      {/* Scanner Window */}
      <div className="scanner-window" style={{ marginBottom: "28px" }}>
        <div className="scanner-laser"></div>
        <QrCode size={56} style={{ color: "rgba(255,255,255,0.12)", marginBottom: "10px" }} />
        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>
          Pass Scan Beam Ready
        </span>
      </div>

      <form onSubmit={handleVerify}>
        <div className="form-group">
          <div className="input-icon-wrapper">
            <input
              type="text"
              className="form-input"
              placeholder="Access Pass ID (e.g., QUI-XXXXXXXX)"
              value={passId}
              onChange={(e) => setPassId(e.target.value.toUpperCase())}
              disabled={verifying}
            />
            <Lock size={18} className="input-icon" />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={verifying || !passId.trim()} style={{ marginTop: "8px" }}>
          {verifying ? "Verifying Game Pass..." : `Start ${gameName}`}
        </button>
      </form>
    </div>
  );
}
