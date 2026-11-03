import React, { useState, useEffect } from "react";
import { Trophy, ArrowRight, Star, Zap, BarChart2, Play, CheckCircle, Lock } from "lucide-react";

const ALL_GAMES = [
  { key: "quiz",       label: "Classic Quiz",    emoji: "🧠", color: "#8b5cf6", glow: "rgba(139,92,246,0.35)", gradient: "linear-gradient(135deg,rgba(139,92,246,0.18),rgba(139,92,246,0.05))", border: "rgba(139,92,246,0.3)" },
  { key: "speed",      label: "Speed Quiz",      emoji: "⚡", color: "#f59e0b", glow: "rgba(245,158,11,0.35)",  gradient: "linear-gradient(135deg,rgba(245,158,11,0.18),rgba(245,158,11,0.05))",  border: "rgba(245,158,11,0.3)"  },
  { key: "truefalse",  label: "True or False",   emoji: "🎯", color: "#10b981", glow: "rgba(16,185,129,0.35)", gradient: "linear-gradient(135deg,rgba(16,185,129,0.18),rgba(16,185,129,0.05))", border: "rgba(16,185,129,0.3)"  },
  { key: "unscramble", label: "Word Unscramble", emoji: "🔤", color: "#06b6d4", glow: "rgba(6,182,212,0.35)",  gradient: "linear-gradient(135deg,rgba(6,182,212,0.18),rgba(6,182,212,0.05))",  border: "rgba(6,182,212,0.3)"   },
];

/**
 * Props:
 *  user            — { name, userId }
 *  justPlayedGame  — "quiz" | "speed" | "truefalse" | "unscramble"
 *  justPlayedScore — number
 *  gameScores      — { quiz: 200, truefalse: 150, ... }   (all games so far incl. just played)
 *  playedGames     — ["quiz", "truefalse", ...]            (all games played incl. just played)
 *  onPlayNext      — fn(gameKey) — user picked another game
 *  onViewLeaderboard — fn() — go to leaderboard
 */
function GameResultCard({ user, justPlayedGame, justPlayedScore, gameScores, playedGames, onPlayNext, onViewLeaderboard }) {
  const [visible, setVisible] = useState(false);
  const [selectedNext, setSelectedNext] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const total = Object.values(gameScores).reduce((s, v) => s + v, 0);
  const justPlayed = ALL_GAMES.find((g) => g.key === justPlayedGame);
  const remaining = ALL_GAMES.filter((g) => !playedGames.includes(g.key));
  const allDone = remaining.length === 0;

  const handlePlayNext = () => {
    if (selectedNext) onPlayNext(selectedNext);
  };

  return (
    <div
      className="glass-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
        transition: "all 0.45s cubic-bezier(0.34,1.4,0.64,1)",
      }}
    >
      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: `linear-gradient(135deg, ${justPlayed?.color}22, ${justPlayed?.color}11)`,
          border: `2px solid ${justPlayed?.color}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 14px", fontSize: "2rem",
          animation: "float 3s infinite ease-in-out",
        }}>
          {justPlayed?.emoji}
        </div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>
          {justPlayed?.label} — Completed!
        </div>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "2px" }}>{user.name}</h2>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "4px 14px", borderRadius: "20px",
          background: `${justPlayed?.color}18`, border: `1px solid ${justPlayed?.color}44`,
          color: justPlayed?.color, fontWeight: 700, fontSize: "1.1rem",
        }}>
          <Star size={14} /> +{justPlayedScore} pts
        </div>
      </div>

      {/* ── Score Breakdown ── */}
      <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "18px", padding: "6px", marginBottom: "20px",
      }}>
        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, padding: "10px 14px 6px" }}>
          Your Scores
        </div>
        {ALL_GAMES.map((g) => {
          const played = playedGames.includes(g.key);
          const sc = gameScores[g.key];
          const isJustPlayed = g.key === justPlayedGame;
          return (
            <div key={g.key} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "11px 14px", borderRadius: "12px",
              background: isJustPlayed ? `${g.color}12` : "transparent",
              border: isJustPlayed ? `1px solid ${g.color}28` : "1px solid transparent",
              margin: "3px",
              transition: "all 0.3s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.1rem" }}>{g.emoji}</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: played ? "#e5e7eb" : "#4b5563" }}>
                  {g.label}
                </span>
                {isJustPlayed && (
                  <span style={{ fontSize: "0.65rem", background: `${g.color}22`, color: g.color, border: `1px solid ${g.color}44`, borderRadius: "99px", padding: "2px 8px", fontWeight: 700, letterSpacing: "0.5px" }}>
                    NEW
                  </span>
                )}
              </div>
              <span style={{
                fontWeight: 800, fontSize: "1.05rem",
                color: played ? g.color : "#374151",
                filter: played ? `drop-shadow(0 0 4px ${g.color}60)` : "none",
              }}>
                {played ? `${sc} pts` : "—"}
              </span>
            </div>
          );
        })}

        {/* Divider + Total */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "8px 14px" }} />
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 14px",
          background: "linear-gradient(135deg,rgba(139,92,246,0.12),rgba(6,182,212,0.08))",
          borderRadius: "12px", margin: "3px",
        }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#c4b5fd", display: "flex", alignItems: "center", gap: "6px" }}>
            <Trophy size={16} style={{ color: "#fbbf24" }} /> Total Score
          </span>
          <span style={{
            fontWeight: 900, fontSize: "1.5rem",
            background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {total}
          </span>
        </div>
      </div>

      {/* ── Play Next / Done ── */}
      {allDone ? (
        /* All 4 games played */
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div style={{
            padding: "14px", borderRadius: "16px", marginBottom: "16px",
            background: "linear-gradient(135deg,rgba(251,191,36,0.12),rgba(245,158,11,0.06))",
            border: "1px solid rgba(251,191,36,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          }}>
            <span style={{ fontSize: "1.5rem" }}>🏆</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 800, color: "#fbbf24", fontSize: "0.95rem" }}>All 4 Games Completed!</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Your total: {total} pts</div>
            </div>
          </div>
          <button onClick={onViewLeaderboard} className="btn-primary">
            <BarChart2 size={18} /> View Leaderboard & Final Rank
          </button>
        </div>
      ) : (
        /* Still more games to play */
        <div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: "10px" }}>
            <Zap size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
            Play Another Game
          </div>

          {/* Remaining game options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            {remaining.map((g) => (
              <button
                key={g.key}
                onClick={() => setSelectedNext(selectedNext === g.key ? null : g.key)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "13px 16px", borderRadius: "14px", cursor: "pointer",
                  background: selectedNext === g.key ? g.gradient : "rgba(255,255,255,0.02)",
                  border: `1px solid ${selectedNext === g.key ? g.color : "rgba(255,255,255,0.07)"}`,
                  boxShadow: selectedNext === g.key ? `0 0 20px ${g.glow}` : "none",
                  color: "var(--text-primary)", fontFamily: "inherit",
                  transition: "all 0.25s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.2rem" }}>{g.emoji}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: selectedNext === g.key ? g.color : "#e5e7eb" }}>{g.label}</div>
                  </div>
                </div>
                {selectedNext === g.key
                  ? <CheckCircle size={18} style={{ color: g.color }} />
                  : <Play size={16} style={{ color: "#6b7280" }} />
                }
              </button>
            ))}

            {/* Already played games — locked */}
            {playedGames.filter((pk) => pk !== justPlayedGame).map((pk) => {
              const g = ALL_GAMES.find((x) => x.key === pk);
              if (!g) return null;
              return (
                <div key={pk} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "11px 16px", borderRadius: "14px",
                  background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)",
                  opacity: 0.45,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.2rem" }}>{g.emoji}</span>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#6b7280" }}>{g.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#4b5563", fontSize: "0.8rem" }}>
                    <Lock size={13} /> Played
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={onViewLeaderboard}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              <BarChart2 size={16} /> Leaderboard
            </button>
            <button
              onClick={handlePlayNext}
              disabled={!selectedNext}
              className="btn-primary"
              style={{
                flex: 2,
                background: selectedNext
                  ? `linear-gradient(135deg, ${ALL_GAMES.find((g) => g.key === selectedNext)?.color}, ${ALL_GAMES.find((g) => g.key === selectedNext)?.color}99)`
                  : undefined,
                boxShadow: selectedNext
                  ? `0 0 20px ${ALL_GAMES.find((g) => g.key === selectedNext)?.glow}`
                  : undefined,
              }}
            >
              <ArrowRight size={18} />
              {selectedNext ? `Start ${ALL_GAMES.find((g) => g.key === selectedNext)?.label}` : "Select a Game"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameResultCard;
