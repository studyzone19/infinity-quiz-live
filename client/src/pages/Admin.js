import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../config/api";
import { Shield, KeyRound, Download, Trash2, RefreshCw, Users, Trophy, ExternalLink, AlertTriangle } from "lucide-react";

export default function Admin() {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [leaderboard, setLeaderboard] = useState([]);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin.trim() === "RAM@192002") {
      setIsAuthenticated(true);
      setError("");
      fetchData();
    } else {
      setError("Incorrect Admin PIN.");
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/leaderboard/all`);
      setLeaderboard(res.data.leaderboard || []);
    } catch (err) {
      setError("Failed to fetch admin data from backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetScores = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/admin/reset`, { adminKey: pin.trim() || "RAM@192002" });
      setActionMessage(res.data.message || "Scores successfully reset!");
      setResetConfirm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset scores.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    window.open(`${API_BASE}/api/export/csv`, "_blank");
  };

  if (!isAuthenticated) {
    return (
      <div className="glass-card" style={{ maxWidth: "420px", margin: "40px auto" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ display: "inline-flex", padding: "14px", borderRadius: "50%", background: "rgba(139, 92, 246, 0.15)", color: "var(--color-primary)", marginBottom: "12px" }}>
            <Shield size={36} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Organizer Admin Portal</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
            Enter your admin PIN to manage quiz operations and data.
          </p>
        </div>

        {error && (
          <div className="toast" style={{ marginBottom: "16px" }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <div className="input-icon-wrapper">
              <input
                type="password"
                className="form-input"
                placeholder="Enter Admin PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
              />
              <KeyRound size={18} className="input-icon" />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "10px" }}>
            Unlock Admin Panel
          </button>
        </form>
      </div>
    );
  }

  const uniquePlayers = new Set(leaderboard.map((r) => r.userId)).size;
  const totalGamesPlayed = leaderboard.length;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 12px" }}>
      {/* Top Bar */}
      <div className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <Shield size={24} style={{ color: "var(--color-primary)" }} /> Organizer Dashboard
          </h2>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Infinity Quiz Live Control Station
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={fetchData} className="btn-secondary" style={{ padding: "8px 14px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button onClick={handleDownloadCSV} className="btn-primary" style={{ padding: "8px 14px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {actionMessage && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.2)", border: "1px solid #10b981", color: "#10b981", marginBottom: "16px", fontSize: "0.9rem" }}>
          ✓ {actionMessage}
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--color-primary)", marginBottom: "8px" }}>
            <Users size={22} />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>Contenders</span>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900 }}>{uniquePlayers}</div>
        </div>
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#10b981", marginBottom: "8px" }}>
            <Trophy size={22} />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>Games Played</span>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900 }}>{totalGamesPlayed}</div>
        </div>
      </div>

      {/* Quick Launch Links */}
      <div className="glass-card" style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "12px" }}>Direct Screen Links</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a href="/display" target="_blank" rel="noreferrer" className="btn-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
            <ExternalLink size={14} /> Full TV Display
          </a>
          <a href="/final-leaderboard" target="_blank" rel="noreferrer" className="btn-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
            <ExternalLink size={14} /> Final Leaderboard
          </a>
          <a href="/game1" target="_blank" rel="noreferrer" className="btn-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
            <ExternalLink size={14} /> Kiosk Station (Game 1)
          </a>
          <a href="/game2" target="_blank" rel="noreferrer" className="btn-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
            <ExternalLink size={14} /> Kiosk Station (Game 2)
          </a>
        </div>
      </div>

      {/* Danger Zone: Reset Scores */}
      <div className="glass-card" style={{ border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.05)", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h4 style={{ color: "#ef4444", margin: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
              <Trash2 size={16} /> Reset Tournament Scores
            </h4>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Clears all player game scores for a fresh tournament session. User registrations remain intact.
            </p>
          </div>
          {resetConfirm ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleResetScores} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
                Yes, Reset All!
              </button>
              <button onClick={() => setResetConfirm(false)} className="btn-secondary" style={{ padding: "8px 14px" }}>
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setResetConfirm(true)} style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", color: "#ef4444", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}>
              Reset Scores
            </button>
          )}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-card">
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "14px" }}>Current Game Records ({leaderboard.length})</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "10px 8px" }}>Name</th>
                <th style={{ padding: "10px 8px" }}>User ID</th>
                <th style={{ padding: "10px 8px" }}>Game</th>
                <th style={{ padding: "10px 8px" }}>Score</th>
                <th style={{ padding: "10px 8px" }}>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, i) => {
                const total = (row.correct || 0) + (row.wrong || 0);
                const acc = total > 0 ? Math.round((row.correct / total) * 100) : 0;
                return (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "10px 8px", fontWeight: 600 }}>{row.name}</td>
                    <td style={{ padding: "10px 8px", color: "var(--text-secondary)", fontFamily: "monospace" }}>{row.userId}</td>
                    <td style={{ padding: "10px 8px", textTransform: "capitalize" }}>{row.game_type || "quiz"}</td>
                    <td style={{ padding: "10px 8px", color: "#f59e0b", fontWeight: 700 }}>{row.score}</td>
                    <td style={{ padding: "10px 8px" }}>{acc}%</td>
                  </tr>
                );
              })}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "24px", color: "var(--text-secondary)" }}>
                    No game scores recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
