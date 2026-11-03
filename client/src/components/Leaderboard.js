import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { API_BASE } from "../config/api";
import { Trophy, Award, Calendar, Percent, Flame, Download, RefreshCw, Users, Home } from "lucide-react";

const GAME_LABELS = {
  quiz: { label: "🧠 Classic", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.25)" },
  speed: { label: "⚡ Speed", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" },
  truefalse: { label: "🎯 T/F", color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  unscramble: { label: "🔤 Word", color: "#06b6d4", bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.25)" },
};

function Leaderboard({ gameFilter }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const navigate = useNavigate();

  const getFilteredLeaders = (data) => {
    let result = data;
    if (gameFilter) {
      result = data.filter(player => player.game_type === gameFilter);
    }
    // Sort by score descending, then correct descending
    return result.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correct !== a.correct) return b.correct - a.correct;
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  };

  useEffect(() => {
    const socket = io(API_BASE);

    socket.on("leaderboard-update", (data) => {
      setLeaders(getFilteredLeaders(data));
      setLoading(false);
    });

    // Also fetch via API as fallback
    fetchLeaderboard();

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/leaderboard/all`);
      if (res.data?.leaderboard) {
        setLeaders(getFilteredLeaders(res.data.leaderboard));
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleDownloadCSV = async () => {
    try {
      const link = document.createElement("a");
      link.href = `${API_BASE}/api/export/csv`;
      link.download = "infinity_quiz_leaderboard.csv";
      link.click();
    } catch (err) {
      console.error("CSV download failed:", err);
    }
  };

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1: return <Trophy size={20} style={{ color: "#fbbf24", filter: "drop-shadow(0 0 4px #fbbf24)" }} />;
      case 2: return <Award size={20} style={{ color: "#d1d5db", filter: "drop-shadow(0 0 4px #d1d5db)" }} />;
      case 3: return <Award size={20} style={{ color: "#b45309", filter: "drop-shadow(0 0 4px #b45309)" }} />;
      default: return <span style={{ color: "var(--text-secondary)", fontWeight: "bold" }}>{rank}</span>;
    }
  };

  const getRankClass = (rank) => {
    if (rank <= 3) return `rank-highlight rank-${rank}`;
    return "";
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return ts;
    }
  };

  const getGameBadge = (gameType) => {
    const g = GAME_LABELS[gameType] || GAME_LABELS["quiz"];
    return (
      <span
        className="game-type-badge"
        style={{ background: g.bg, border: `1px solid ${g.border}`, color: g.color }}
      >
        {g.label}
      </span>
    );
  };

  return (
    <div className="leaderboard-section">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "12px" }}>
        <Trophy size={28} style={{ color: "#fbbf24", animation: "float 3s infinite ease-in-out" }} />
        <h1 className="brand-heading" style={{ margin: 0 }}>Hall of Fame</h1>
      </div>
      <p className="brand-subheading" style={{ marginBottom: "16px" }}>
        Real-time standings across all 4 games. Each player gets one shot — make it count!
      </p>

      {/* Stats Bar */}
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <span className="leaderboard-stat-badge">
          <Users size={14} />
          <span>{leaders.length} Player{leaders.length !== 1 ? "s" : ""}</span>
        </span>
        <button className="leaderboard-action-btn" onClick={handleRefresh} disabled={refreshing} title="Refresh">
          <RefreshCw size={14} className={refreshing ? "spin" : ""} />
          <span>Refresh</span>
        </button>
        <button className="leaderboard-action-btn" onClick={handleDownloadCSV} title="Download CSV">
          <Download size={14} />
          <span>CSV</span>
        </button>
        <button className="leaderboard-action-btn" onClick={() => navigate("/")} title="Go to Registration"
          style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: "#06b6d4" }}>
          <Home size={14} />
          <span>Home</span>
        </button>
      </div>

      {/* Game Legend */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginBottom: "16px" }}>
        {Object.values(GAME_LABELS).map((g, i) => (
          <span key={i} className="game-type-badge" style={{ background: g.bg, border: `1px solid ${g.border}`, color: g.color, padding: "3px 10px" }}>
            {g.label}
          </span>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
          <span>Synchronizing live rankings...</span>
        </div>
      ) : leaders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "45px 0", color: "var(--text-secondary)", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px dashed var(--border-color)" }}>
          <Flame size={32} style={{ color: "var(--color-primary)", marginBottom: "12px", opacity: 0.6 }} />
          <p>No play sessions recorded yet.</p>
          <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Be the first to secure a spot on the leaderboard!</p>
        </div>
      ) : (
        <div className="leaderboard-container" style={{ animation: "scaleIn 0.4s ease-out" }}>
          <table className="leaderboard-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
            <thead>
              <tr style={{ color: "var(--text-secondary)", fontSize: "0.72rem", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th style={{ padding: "6px 10px", width: "44px" }}>#</th>
                <th style={{ padding: "6px 10px" }}>Player</th>
                <th style={{ padding: "6px 10px", textAlign: "center" }}>Game</th>
                <th style={{ padding: "6px 10px", textAlign: "center" }}>Score</th>
                <th style={{ padding: "6px 10px", textAlign: "center" }}>Acc.</th>
                <th style={{ padding: "6px 10px", textAlign: "right" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {leaders.slice(0, 10).map((player, index) => {
                const rank = index + 1;
                const total = player.correct + player.wrong;
                const accuracy = total > 0 ? Math.round((player.correct / total) * 100) : 0;

                return (
                  <tr
                    key={index}
                    className={getRankClass(rank)}
                    style={{
                      background: rank <= 3 ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border-color)",
                      transition: "transform 0.2s ease"
                    }}
                  >
                    <td style={{ padding: "10px 10px", borderRadius: "12px 0 0 12px", width: "44px", textAlign: "center" }}>
                      {getRankBadge(rank)}
                    </td>
                    <td style={{ padding: "10px 10px" }}>
                      <div style={{ fontWeight: "600", color: rank <= 3 ? "#ffffff" : "var(--text-primary)", fontSize: "0.92rem" }}>
                        {player.name}
                      </div>
                      {player.userId && (
                        <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontFamily: "monospace", marginTop: "2px", opacity: 0.7 }}>
                          {player.userId}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                      {getGameBadge(player.game_type)}
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "center", fontWeight: "700", color: rank === 1 ? "var(--color-secondary)" : "var(--color-primary)", fontSize: "1.05rem" }}>
                      {player.score}
                    </td>
                    <td style={{ padding: "10px 10px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                        <Percent size={11} style={{ color: accuracy >= 80 ? "var(--color-success)" : accuracy >= 50 ? "var(--color-warning)" : "var(--color-error)" }} />
                        {accuracy}%
                      </span>
                    </td>
                    <td style={{ padding: "10px 10px", borderRadius: "0 12px 12px 0", textAlign: "right", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                      {formatTimestamp(player.timestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
