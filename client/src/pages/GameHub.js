import React, { useState } from "react";
import { Zap, CheckSquare, Shuffle, Brain, ArrowRight, Clock, Hash, CheckCircle, Lock } from "lucide-react";

const GAMES = [
  {
    id: "quiz",
    icon: Brain,
    emoji: "🧠",
    title: "Classic Quiz",
    subtitle: "MCQ Challenge",
    description: "5 multiple-choice questions. Think carefully and score 100 pts per correct answer.",
    color: "#8b5cf6",
    glow: "rgba(139, 92, 246, 0.35)",
    gradient: "linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.05) 100%)",
    border: "rgba(139, 92, 246, 0.3)",
    stats: [
      { icon: Hash, label: "5 Questions" },
      { icon: Clock, label: "No Time Limit" },
    ],
  },
  {
    id: "speed",
    icon: Zap,
    emoji: "⚡",
    title: "Speed Quiz",
    subtitle: "Beat the Clock",
    description: "5 MCQ questions but each has a 10-second timer! Fast thinking wins.",
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.35)",
    gradient: "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) 100%)",
    border: "rgba(245, 158, 11, 0.3)",
    stats: [
      { icon: Hash, label: "5 Questions" },
      { icon: Clock, label: "10s Per Q" },
    ],
  },
  {
    id: "truefalse",
    icon: CheckSquare,
    emoji: "🎯",
    title: "True or False",
    subtitle: "Rapid Fire",
    description: "10 rapid-fire True/False statements. Simple but tricky — 50 pts per correct!",
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.35)",
    gradient: "linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)",
    border: "rgba(16, 185, 129, 0.3)",
    stats: [
      { icon: Hash, label: "10 Statements" },
      { icon: Clock, label: "No Time Limit" },
    ],
  },
  {
    id: "unscramble",
    icon: Shuffle,
    emoji: "🔤",
    title: "Word Unscramble",
    subtitle: "Decode It Fast",
    description: "5 scrambled tech words — unscramble each in 30 seconds for 150 pts!",
    color: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.35)",
    gradient: "linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.05) 100%)",
    border: "rgba(6, 182, 212, 0.3)",
    stats: [
      { icon: Hash, label: "5 Words" },
      { icon: Clock, label: "30s Per Word" },
    ],
  },
];

function GameHub({ user, onSelectGame, playedGames = [], gameScores = {} }) {
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const handleCardClick = (game) => {
    if (confirming) return;
    if (playedGames.includes(game.id)) return; // already played — ignore click
    setSelected(game);
  };

  const handleConfirm = () => {
    if (!selected) return;
    setConfirming(true);
    setTimeout(() => {
      onSelectGame(selected.id);
    }, 400);
  };

  const handleCancel = () => {
    setSelected(null);
  };

  const totalSoFar = Object.values(gameScores).reduce((s, v) => s + v, 0);
  const gamesLeft = GAMES.filter((g) => !playedGames.includes(g.id)).length;

  return (
    <div className="gamehub-container">
      {/* Header */}
      <div className="gamehub-header">
        <div className="gamehub-welcome-tag">
          <span className="welcome-verified-dot" style={{ background: "#10b981", boxShadow: "0 0 8px #10b981" }}></span>
          <span>Verified: {user.name}</span>
        </div>
        <h1 className="gamehub-title">
          {playedGames.length === 0 ? (
            <>Choose Your<br /><span className="gamehub-title-highlight">Game</span></>
          ) : (
            <>Play<br /><span className="gamehub-title-highlight">Next Game</span></>
          )}
        </h1>

        {/* Progress bar + score if already played some */}
        {playedGames.length > 0 && (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "16px", padding: "12px 16px", marginBottom: "8px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Progress
              </span>
              <span style={{
                fontWeight: 800, fontSize: "1rem",
                background: "linear-gradient(135deg,#8b5cf6,#06b6d4)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                {totalSoFar} pts total
              </span>
            </div>
            {/* Mini game score rows */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {GAMES.map((g) => {
                const done = playedGames.includes(g.id);
                return (
                  <div key={g.id} style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "4px 10px", borderRadius: "99px",
                    background: done ? `${g.color}15` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${done ? g.color + "40" : "rgba(255,255,255,0.06)"}`,
                    fontSize: "0.78rem", fontWeight: 700,
                    color: done ? g.color : "#4b5563",
                  }}>
                    <span>{g.emoji}</span>
                    <span>{done ? `${gameScores[g.id]} pts` : "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="gamehub-subtitle">
          {gamesLeft === 0
            ? "🏆 You've played all 4 games!"
            : playedGames.length === 0
            ? <>Select one game — <strong style={{ color: "#10b981" }}>you can play all 4!</strong></>
            : <>{gamesLeft} game{gamesLeft !== 1 ? "s" : ""} remaining — keep going!</>
          }
        </p>
      </div>

      {/* Game Cards Grid */}
      <div className="gamehub-grid">
        {GAMES.map((game) => {
          const Icon = game.icon;
          const isSelected = selected?.id === game.id;
          const isPlayed = playedGames.includes(game.id);
          return (
            <div
              key={game.id}
              className={`game-card ${isSelected ? "game-card-selected" : ""}`}
              style={{
                "--card-color": game.color,
                "--card-glow": game.glow,
                "--card-gradient": game.gradient,
                "--card-border": game.border,
                borderColor: isPlayed ? "rgba(255,255,255,0.04)" : isSelected ? game.color : undefined,
                boxShadow: isSelected ? `0 0 30px ${game.glow}, 0 8px 32px rgba(0,0,0,0.4)` : undefined,
                opacity: isPlayed ? 0.42 : 1,
                cursor: isPlayed ? "not-allowed" : "pointer",
                filter: isPlayed ? "grayscale(0.6)" : "none",
                position: "relative",
              }}
              onClick={() => handleCardClick(game)}
            >
              {/* Played overlay */}
              {isPlayed && (
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: "99px", padding: "3px 10px",
                  display: "flex", alignItems: "center", gap: "5px",
                  fontSize: "0.7rem", fontWeight: 700, color: "#10b981",
                }}>
                  <CheckCircle size={11} /> {gameScores[game.id] ?? 0} pts
                </div>
              )}

              {/* Selected Check */}
              {isSelected && !isPlayed && (
                <div className="game-card-check" style={{ background: game.color }}>
                  ✓
                </div>
              )}

              {/* Icon */}
              <div className="game-card-icon" style={{ background: `${game.color}1a`, borderColor: `${game.color}33`, color: game.color }}>
                <span style={{ fontSize: "2rem" }}>{game.emoji}</span>
              </div>

              {/* Info */}
              <div className="game-card-info">
                <div className="game-card-subtitle" style={{ color: game.color }}>{game.subtitle}</div>
                <h3 className="game-card-title">{game.title}</h3>
                <p className="game-card-desc">{game.description}</p>
              </div>

              {/* Stats Row */}
              <div className="game-card-stats">
                {game.stats.map((stat, i) => {
                  const SI = stat.icon;
                  return (
                    <span key={i} className="game-card-stat">
                      <SI size={12} />
                      {stat.label}
                    </span>
                  );
                })}
              </div>

              {/* Play Indicator */}
              <div className="game-card-play" style={{ color: isPlayed ? "#10b981" : game.color }}>
                {isPlayed
                  ? <><CheckCircle size={14} /> Completed</>
                  : isSelected
                  ? "Selected ✓"
                  : <><span>Tap to Select</span><ArrowRight size={14} /></>
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Button */}
      {selected && !playedGames.includes(selected.id) && (
        <div className="gamehub-confirm-area">
          <div className="gamehub-confirm-card" style={{ borderColor: selected.color, boxShadow: `0 0 20px ${selected.glow}` }}>
            <span style={{ fontSize: "1.5rem" }}>{selected.emoji}</span>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>You selected</div>
              <div style={{ fontWeight: "800", fontSize: "1.1rem", color: selected.color }}>{selected.title}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <button className="btn-secondary" onClick={handleCancel} style={{ flex: 1 }}>
              Change
            </button>
            <button
              className="btn-primary"
              onClick={handleConfirm}
              disabled={confirming}
              style={{
                flex: 2,
                background: `linear-gradient(135deg, ${selected.color} 0%, ${selected.color}99 100%)`,
                boxShadow: `0 0 25px ${selected.glow}`
              }}
            >
              {confirming ? "Starting..." : `Start ${selected.title}`}
              {!confirming && <ArrowRight size={18} />}
            </button>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", textAlign: "center", marginTop: "10px", opacity: 0.7 }}>
            ✅ You can play more games after this one!
          </p>
        </div>
      )}
    </div>
  );
}

export default GameHub;
