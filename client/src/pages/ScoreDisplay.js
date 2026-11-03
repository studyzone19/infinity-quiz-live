import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { API_BASE } from "../config/api";
import { Trophy, Award, Star, Zap, RefreshCw, Tv2, Users, ChevronLeft, ChevronRight } from "lucide-react";

// ── Game config matching existing game_type values ──
const GAMES = [
  { key: "quiz",        label: "Game 1 (Quiz)",    emoji: "🧠", color: "#8b5cf6", glow: "rgba(139,92,246,0.4)"  },
  { key: "truefalse",   label: "Game 2 (T/F)",     emoji: "🎯", color: "#10b981", glow: "rgba(16,185,129,0.4)"  },
  { key: "speed",       label: "Game 3 (Speed)",   emoji: "⚡", color: "#f59e0b", glow: "rgba(245,158,11,0.4)"  },
  { key: "unscramble",  label: "Game 4 (Word)",    emoji: "🔤", color: "#06b6d4", glow: "rgba(6,182,212,0.4)"   },
];

// Group raw leaderboard rows (one game each) into per-player objects
function groupByPlayer(rows) {
  const map = {};
  rows.forEach((row, idx) => {
    const uid = row.userId || row.name + idx;
    if (!map[uid]) {
      map[uid] = { userId: uid, name: row.name, games: {}, total: 0 };
    }
    const gt = row.game_type || "quiz";
    map[uid].games[gt] = (map[uid].games[gt] || 0) + (row.score || 0);
    map[uid].total += row.score || 0;
  });
  // Sort by total desc
  return Object.values(map).sort((a, b) => b.total - a.total);
}

// Rank medal helper
function getRankMedal(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export default function ScoreDisplay({ listOnly = false, cardsOnly = false }) {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  // ── Socket & fetch ──
  useEffect(() => {
    const socket = io(API_BASE);
    socket.on("leaderboard-update", (data) => {
      setRawRows(data);
      setPlayers(groupByPlayer(data).slice(0, 10));
      setLoading(false);
    });
    fetchData();
    return () => socket.disconnect();
  }, []);

  // ── Auto-rotate cards ──
  useEffect(() => {
    if (!autoPlay || players.length < 2) return;
    timerRef.current = setInterval(() => switchCard(1), 4000);
    return () => clearInterval(timerRef.current);
  }, [autoPlay, players.length, currentIdx]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/leaderboard/all`);
      if (res.data?.leaderboard) {
        setRawRows(res.data.leaderboard);
        setPlayers(groupByPlayer(res.data.leaderboard).slice(0, 10));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const switchCard = (dir) => {
    if (animating || players.length === 0) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrentIdx((prev) => {
        const next = (prev + dir + players.length) % players.length;
        return next;
      });
      setAnimating(false);
    }, 250);
  };

  const currentPlayer = players[currentIdx];
  const topPlayers = players.slice(0, 10);

  // ── Styles ──
  const styles = {
    page: {
      minHeight: "100vh",
      width: "100%",
      background: "#06090f",
      backgroundImage:
        "radial-gradient(circle at 15% 25%, rgba(139,92,246,0.12) 0%, transparent 45%), radial-gradient(circle at 85% 75%, rgba(6,182,212,0.1) 0%, transparent 45%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "24px 16px",
      fontFamily: "'Outfit', sans-serif",
      color: "#f3f4f6",
      boxSizing: "border-box",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      marginBottom: "28px",
      width: "100%",
      maxWidth: "1200px",
    },
    headerTitle: {
      fontSize: "1.6rem",
      fontWeight: 800,
      background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      letterSpacing: "-0.5px",
    },
    liveDot: {
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: "#10b981",
      boxShadow: "0 0 10px #10b981",
      animation: "pulse 2s infinite",
    },
    body: {
      display: "flex",
      gap: "24px",
      width: "100%",
      maxWidth: "1200px",
      alignItems: "flex-start",
      justifyContent: "center",
      flexWrap: "wrap",
    },
    // ── Score Card (left) ──
    cardPanel: {
      flex: "1 1 340px",
      minWidth: "300px",
      maxWidth: "480px",
    },
    card: {
      background: "rgba(13,19,33,0.85)",
      backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "28px",
      padding: "32px 28px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
      position: "relative",
      overflow: "hidden",
      opacity: animating ? 0 : 1,
      transform: animating ? "scale(0.97)" : "scale(1)",
      transition: "opacity 0.25s ease, transform 0.25s ease",
    },
    cardGlow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "3px",
      background: "linear-gradient(90deg, #8b5cf6, #06b6d4)",
      borderRadius: "28px 28px 0 0",
    },
    separator: {
      height: "1px",
      background: "rgba(255,255,255,0.08)",
      margin: "20px 0",
    },
    playerName: {
      fontSize: "1.9rem",
      fontWeight: 800,
      background: "linear-gradient(135deg, #fff 0%, #c4b5fd 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      textAlign: "center",
      marginBottom: "4px",
      letterSpacing: "-0.5px",
    },
    playerEmoji: {
      fontSize: "2.4rem",
      textAlign: "center",
      marginBottom: "8px",
      display: "block",
    },
    // ── Per-game rows ──
    gameRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "13px 16px",
      borderRadius: "14px",
      marginBottom: "10px",
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(255,255,255,0.02)",
      transition: "transform 0.2s ease",
    },
    gameLabel: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontSize: "0.95rem",
      fontWeight: 600,
      color: "#e5e7eb",
    },
    gameScore: {
      fontSize: "1.25rem",
      fontWeight: 800,
    },
    gameEmoji: {
      fontSize: "1.2rem",
      width: "32px",
      height: "32px",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(255,255,255,0.06)",
    },
    // ── Total row ──
    totalRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px",
      borderRadius: "16px",
      background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.12))",
      border: "1px solid rgba(139,92,246,0.25)",
      marginTop: "6px",
    },
    totalLabel: {
      fontSize: "1rem",
      fontWeight: 700,
      color: "#c4b5fd",
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    },
    totalScore: {
      fontSize: "1.9rem",
      fontWeight: 900,
      background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    // ── Rank chip ──
    rankChip: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 14px",
      borderRadius: "20px",
      background: "rgba(251,191,36,0.12)",
      border: "1px solid rgba(251,191,36,0.3)",
      fontSize: "0.9rem",
      fontWeight: 700,
      color: "#fbbf24",
      margin: "16px auto 0",
    },
    rankChipBlock: {
      textAlign: "center",
    },
    // ── Controls ──
    controls: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      justifyContent: "center",
      marginTop: "20px",
    },
    navBtn: {
      width: "42px",
      height: "42px",
      borderRadius: "50%",
      border: "1px solid rgba(255,255,255,0.1)",
      background: "rgba(255,255,255,0.04)",
      color: "#9ca3af",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s ease",
      fontFamily: "inherit",
    },
    dotRow: {
      display: "flex",
      gap: "6px",
      alignItems: "center",
      flexWrap: "wrap",
      justifyContent: "center",
      maxWidth: "180px",
    },
    dot: (active) => ({
      width: active ? 20 : 8,
      height: 8,
      borderRadius: "4px",
      background: active ? "linear-gradient(90deg,#8b5cf6,#06b6d4)" : "rgba(255,255,255,0.15)",
      transition: "all 0.3s ease",
    }),
    autoBtn: (on) => ({
      padding: "6px 14px",
      borderRadius: "20px",
      border: `1px solid ${on ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)"}`,
      background: on ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
      color: on ? "#10b981" : "#9ca3af",
      fontSize: "0.75rem",
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    }),
    // ── Leaderboard Panel (right) ──
    lbPanel: {
      flex: "1 1 300px",
      minWidth: "260px",
    },
    lbCard: {
      background: "rgba(13,19,33,0.85)",
      backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "24px",
      padding: "24px 20px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    },
    lbHeader: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "18px",
    },
    lbTitle: {
      fontSize: "1.1rem",
      fontWeight: 800,
      background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    lbRow: (rank, isActive) => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 14px",
      borderRadius: "12px",
      marginBottom: "8px",
      border: `1px solid ${isActive ? "rgba(139,92,246,0.35)" : "rgba(255,255,255,0.05)"}`,
      background: isActive
        ? "rgba(139,92,246,0.1)"
        : rank <= 3
        ? "rgba(251,191,36,0.04)"
        : "rgba(255,255,255,0.02)",
      transition: "all 0.3s ease",
      cursor: "pointer",
    }),
    lbRank: {
      width: "28px",
      fontSize: "0.9rem",
      fontWeight: 700,
      color: "#9ca3af",
      flexShrink: 0,
    },
    lbName: {
      flex: 1,
      fontSize: "0.9rem",
      fontWeight: 600,
      color: "#e5e7eb",
      marginLeft: "8px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    lbScore: {
      fontSize: "1rem",
      fontWeight: 800,
      background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    // ── Empty / Loading ──
    empty: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#6b7280",
    },
    counter: {
      fontSize: "0.78rem",
      color: "#6b7280",
      fontWeight: 500,
      textAlign: "center",
      marginTop: "8px",
    },
  };

  return (
    <div style={styles.page}>
      {/* Inline keyframes */}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(1.2)} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .nav-btn:hover { background:rgba(255,255,255,0.1)!important; color:#fff!important; }
        .lb-row:hover { border-color:rgba(139,92,246,0.3)!important; background:rgba(139,92,246,0.07)!important; }
        .game-row:hover { transform:translateX(4px); }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <Tv2 size={26} style={{ color: "#8b5cf6" }} />
        <span style={styles.headerTitle}>♾️ INFINITY QUIZ — LIVE SCORES</span>
        <div style={styles.liveDot} />
      </div>

      {loading ? (
        <div style={styles.empty}>
          <RefreshCw size={36} style={{ color: "#8b5cf6", marginBottom: 16, animation: "spin 1.2s linear infinite" }} />
          <p>Syncing live scores...</p>
        </div>
      ) : players.length === 0 ? (
        <div style={styles.empty}>
          <Trophy size={48} style={{ color: "#8b5cf6", marginBottom: 16, opacity: 0.5 }} />
          <p style={{ fontSize: "1.1rem", marginBottom: 8 }}>No scores yet</p>
          <p style={{ fontSize: "0.85rem" }}>Be the first to play and claim your spot!</p>
        </div>
      ) : (
        <div style={styles.body}>

          {/* ── LEFT: Player Score Card ── */}
          {!listOnly && (
            <div style={styles.cardPanel}>
              <div style={styles.card}>
                <div style={styles.cardGlow} />

                {/* Player identity */}
                <span style={styles.playerEmoji}>🎮</span>
                <div style={styles.playerName}>{currentPlayer?.name || "—"}</div>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <span style={{
                    fontSize: "0.72rem", fontWeight: 600, color: "#6b7280",
                    textTransform: "uppercase", letterSpacing: "1px",
                    fontFamily: "monospace"
                  }}>
                    {currentPlayer?.userId}
                  </span>
                </div>

                <div style={styles.separator} />

                {/* Per-game scores */}
                {GAMES.map((g) => {
                  const sc = currentPlayer?.games?.[g.key] ?? "—";
                  const played = currentPlayer?.games?.[g.key] !== undefined;
                  return (
                    <div key={g.key} className="game-row" style={styles.gameRow}>
                      <div style={styles.gameLabel}>
                        <span style={styles.gameEmoji}>{g.emoji}</span>
                        <span>{g.label}</span>
                      </div>
                      <span style={{
                        ...styles.gameScore,
                        color: played ? g.color : "#4b5563",
                        filter: played ? `drop-shadow(0 0 6px ${g.glow})` : "none",
                      }}>
                        {played ? sc : "—"}
                      </span>
                    </div>
                  );
                })}

                <div style={styles.separator} />

                {/* Total */}
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>🏆 Total Score</span>
                  <span style={styles.totalScore}>{currentPlayer?.total ?? 0}</span>
                </div>

                {/* Rank */}
                <div style={styles.rankChipBlock}>
                  <div style={styles.rankChip}>
                    <Star size={14} />
                    RANK &nbsp;
                    {getRankMedal(
                      players.findIndex((p) => p.userId === currentPlayer?.userId) + 1
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation controls */}
              <div style={styles.controls}>
                <button
                  className="nav-btn"
                  style={styles.navBtn}
                  onClick={() => { clearInterval(timerRef.current); switchCard(-1); }}
                  title="Previous"
                >
                  <ChevronLeft size={18} />
                </button>

                <div style={styles.dotRow}>
                  {players.map((_, i) => (
                    <div
                      key={i}
                      style={styles.dot(i === currentIdx)}
                      onClick={() => { clearInterval(timerRef.current); setCurrentIdx(i); }}
                    />
                  ))}
                </div>

                <button
                  className="nav-btn"
                  style={styles.navBtn}
                  onClick={() => { clearInterval(timerRef.current); switchCard(1); }}
                  title="Next"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Auto-play toggle */}
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <button
                  style={styles.autoBtn(autoPlay)}
                  onClick={() => setAutoPlay((p) => !p)}
                >
                  <Zap size={12} />
                  {autoPlay ? "Auto-Rotate ON" : "Auto-Rotate OFF"}
                </button>
              </div>

              <div style={styles.counter}>
                Player {currentIdx + 1} of {players.length}
              </div>

              {cardsOnly && (
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <button
                    onClick={() => navigate("/leaderboard")}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "12px",
                      border: "none",
                      background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
                      color: "#fff",
                      fontFamily: "inherit",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      margin: "0 auto",
                      boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <Trophy size={16} /> Go to Leaderboard
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── RIGHT: Leaderboard ── */}
          {!cardsOnly && (
            <div style={styles.lbPanel}>
              <div style={styles.lbCard}>
                <div style={styles.lbHeader}>
                  <Trophy size={22} style={{ color: "#fbbf24", filter: "drop-shadow(0 0 6px #fbbf2480)" }} />
                  <span style={styles.lbTitle}>TOP PLAYERS</span>
                  <span style={{
                    marginLeft: "auto", fontSize: "0.75rem", color: "#6b7280",
                    display: "flex", alignItems: "center", gap: "4px",
                  }}>
                    <Users size={12} /> {players.length} total
                  </span>
                </div>

              {topPlayers.map((player, i) => {
                const rank = i + 1;
                const isActive = player.userId === currentPlayer?.userId;
                return (
                  <div
                    key={player.userId}
                    className="lb-row"
                    style={styles.lbRow(rank, isActive)}
                    onClick={() => setCurrentIdx(players.indexOf(player))}
                  >
                    <span style={styles.lbRank}>
                      {rank <= 3 ? getRankMedal(rank) : `#${rank}`}
                    </span>
                    <span style={{ ...styles.lbName, color: isActive ? "#c4b5fd" : "#e5e7eb" }}>
                      {player.name}
                    </span>
                    <span style={styles.lbScore}>{player.total}</span>
                  </div>
                );
              })}

              {/* Game legend */}
              <div style={{ marginTop: "20px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" }}>
                <div style={{ fontSize: "0.72rem", color: "#4b5563", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px", fontWeight: 600 }}>
                  Games
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {GAMES.map((g) => (
                    <div key={g.key} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem" }}>
                      <span style={{ fontSize: "0.95rem" }}>{g.emoji}</span>
                      <span style={{ color: g.color, fontWeight: 600 }}>{g.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refresh */}
              <button
                onClick={fetchData}
                style={{
                  marginTop: "16px",
                  width: "100%",
                  padding: "10px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: "#6b7280",
                  fontFamily: "inherit",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
