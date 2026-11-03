import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE } from "../config/api";
import sound from "../utils/sound";
import { Trophy, ArrowRight, Shuffle, Clock, AlertCircle, Check, Delete } from "lucide-react";
const TIME_PER_WORD = 30;
const POINTS_PER_CORRECT = 150;

function Unscramble({ user, onExit }) {
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null); // "correct" | "wrong" | "timeout"

  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);

  const [timeLeft, setTimeLeft] = useState(TIME_PER_WORD);
  const timerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (loading || finished || submitted) return;

    setTimeLeft(TIME_PER_WORD);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentQ, loading, finished]);

  const handleTimeUp = () => {
    setSubmitted(true);
    setFeedback("timeout");
    const newWrong = wrongAnswers + 1;
    setWrongAnswers(newWrong);
    advance(score, correctAnswers, newWrong);
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/api/questions/unscramble`);
      setQuestions(res.data.questions);
    } catch (e) {
      setError("Failed to load Word Unscramble questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || submitted) return;
    clearInterval(timerRef.current);

    const question = questions[currentQ];
    const isCorrect = userInput.trim().toUpperCase() === question.word.toUpperCase();

    let newScore = score;
    let newCorrect = correctAnswers;
    let newWrong = wrongAnswers;

    setSubmitted(true);
    if (isCorrect) {
      sound.playCorrect();
      newScore = score + POINTS_PER_CORRECT;
      newCorrect = correctAnswers + 1;
      setScore(newScore);
      setCorrectAnswers(newCorrect);
      setFeedback("correct");
    } else {
      sound.playWrong();
      newWrong = wrongAnswers + 1;
      setWrongAnswers(newWrong);
      setFeedback("wrong");
    }

    advance(newScore, newCorrect, newWrong);
  };

  const advance = (newScore, newCorrect, newWrong) => {
    setTimeout(() => {
      if (questions.length > 0 && currentQ < questions.length - 1) {
        setCurrentQ((q) => q + 1);
        setUserInput("");
        setSubmitted(false);
        setFeedback(null);
      } else {
        saveAndFinish(newScore, newCorrect, newWrong);
      }
    }, 1500);
  };

  const saveAndFinish = async (finalScore, finalCorrect, finalWrong) => {
    try {
      await axios.post(`${API_BASE}/api/scores`, {
        userId: user.userId,
        name: user.name,
        score: finalScore,
        correct: finalCorrect,
        wrong: finalWrong,
        gameType: "unscramble",
      });
    } catch (e) {
      // proceed
    } finally {
      sound.playWin();
      setFinished(true);
      setTimeout(() => onExit(finalScore), 600);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
        <div className="spin" style={{ border: "4px solid rgba(255,255,255,0.05)", borderTop: "4px solid #06b6d4", borderRadius: "50%", width: "40px", height: "40px" }}></div>
        <p style={{ marginTop: "20px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>🔤 Loading Word Unscramble...</p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="glass-card" style={{ textAlign: "center", padding: "40px" }}>
        <AlertCircle size={48} style={{ color: "var(--color-error)", margin: "0 auto 16px" }} />
        <h3 style={{ marginBottom: "8px" }}>Load Failed</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>{error}</p>
        <button onClick={loadQuestions} className="btn-primary">Try Again</button>
      </div>
    );
  }

  // ── Finished ──
  if (finished) {
    const accuracy = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
    return (
      <div className="glass-card success-screen">
        <div className="success-icon-container" style={{ background: "rgba(6,182,212,0.1)", borderColor: "rgba(6,182,212,0.2)", color: "#06b6d4" }}>
          <Trophy size={32} />
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>🔤 Word Unscramble Completed</div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "4px" }}>Amazing!</h1>
        <h2 style={{ color: "#06b6d4", fontSize: "1.3rem", fontWeight: 700, marginBottom: "24px" }}>{user.name}</h2>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "20px", marginBottom: "28px", textAlign: "left" }}>
          {[
            { label: "Final Score", value: `${score} pts`, color: "#06b6d4" },
            { label: "Words Solved", value: `${correctAnswers} / ${questions.length}`, color: "var(--color-success)" },
            { label: "Missed / Wrong", value: wrongAnswers, color: "var(--color-error)" },
            { label: "Accuracy", value: `${accuracy}%`, color: "var(--text-primary)" },
          ].map((row, i, arr) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <span style={{ color: "var(--text-secondary)" }}>{row.label}</span>
              <span style={{ fontWeight: "700", color: row.color, fontSize: "1.1rem" }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          <div className="spin" style={{ border: "3px solid rgba(255,255,255,0.08)", borderTop: "3px solid #06b6d4", borderRadius: "50%", width: "18px", height: "18px", flexShrink: 0 }}></div>
          Saving results...
        </div>
      </div>
    );
  }

  const question = questions[currentQ];
  const timerColor = timeLeft <= 5 ? "#ef4444" : timeLeft <= 12 ? "#f59e0b" : "#06b6d4";
  const timerProgress = (timeLeft / TIME_PER_WORD) * 100;
  const progress = ((currentQ + 1) / questions.length) * 100;

  // Display scrambled word as letter tiles
  const scrambledLetters = question.scrambled.split("");

  return (
    <div className="glass-card">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span className="status-badge" style={{ margin: 0, background: "rgba(6,182,212,0.1)", color: "#06b6d4", borderColor: "rgba(6,182,212,0.25)" }}>
          <Shuffle size={14} />
          <span>Word {currentQ + 1} of {questions.length}</span>
        </span>
        <span style={{ fontWeight: "700", color: "#06b6d4", fontSize: "1.1rem" }}>{score} pts</span>
      </div>

      {/* Progress */}
      <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", marginBottom: "14px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "#06b6d4", borderRadius: "99px", transition: "width 0.4s ease", boxShadow: "0 0 8px #06b6d4" }} />
      </div>

      {/* Timer */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "5px" }}>
            <Clock size={12} /> Time Remaining
          </span>
          <span style={{ fontWeight: "800", fontSize: "1.15rem", color: timerColor, transition: "color 0.3s" }}>{timeLeft}s</span>
        </div>
        <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${timerProgress}%`, background: timerColor, borderRadius: "99px", transition: "width 1s linear, background 0.3s", boxShadow: `0 0 8px ${timerColor}` }} />
        </div>
      </div>

      {/* Hint */}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-color)", borderRadius: "99px", padding: "4px 12px" }}>
          💡 Hint: {question.hint}
        </span>
      </div>

      {/* Scrambled Letter Tiles */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginBottom: "24px" }}>
        {scrambledLetters.map((letter, i) => (
          <div key={i} style={{
            width: "38px",
            height: "44px",
            background: "rgba(6,182,212,0.12)",
            border: "2px solid rgba(6,182,212,0.3)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "1.2rem",
            color: "#06b6d4",
            letterSpacing: "0",
            fontFamily: "'JetBrains Mono', monospace",
            boxShadow: "0 2px 8px rgba(6,182,212,0.15)",
            animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
          }}>
            {letter}
          </div>
        ))}
      </div>

      {/* Feedback */}
      {submitted && (
        <div style={{
          textAlign: "center",
          padding: "12px",
          borderRadius: "14px",
          marginBottom: "16px",
          background: feedback === "correct" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
          border: `1px solid ${feedback === "correct" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          fontWeight: "700",
          fontSize: "1rem",
          color: feedback === "correct" ? "#10b981" : "#ef4444",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          animation: "fadeIn 0.3s ease"
        }}>
          {feedback === "correct" ? <Check size={20} /> : <AlertCircle size={20} />}
          {feedback === "correct"
            ? `Correct! +${POINTS_PER_CORRECT} pts 🎉`
            : feedback === "timeout"
            ? `Time's up! The word was: ${question.word}`
            : `Wrong! The word was: ${question.word}`}
        </div>
      )}

      {/* Input & Submit */}
      {!submitted ? (
        <form onSubmit={handleSubmit}>
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.toUpperCase())}
              placeholder="Type the unscrambled word..."
              autoFocus
              style={{
                width: "100%",
                padding: "16px 50px 16px 18px",
                background: "rgba(6,182,212,0.07)",
                border: "2px solid rgba(6,182,212,0.3)",
                borderRadius: "14px",
                color: "#06b6d4",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "1.15rem",
                fontWeight: "700",
                outline: "none",
                letterSpacing: "2px",
                transition: "all 0.3s ease",
                boxSizing: "border-box",
              }}
            />
            {userInput && (
              <button
                type="button"
                onClick={() => setUserInput("")}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "4px" }}
              >
                <Delete size={18} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={!userInput.trim()}
            style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}
          >
            Submit Answer
          </button>
        </form>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "14px", border: "1px solid var(--border-color)" }}>
          <div className="spin" style={{ border: "3px solid rgba(255,255,255,0.08)", borderTop: "3px solid #06b6d4", borderRadius: "50%", width: "20px", height: "20px", flexShrink: 0 }}></div>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: "500" }}>
            {currentQ === questions.length - 1 ? "Saving results..." : "Next word loading..."}
          </span>
        </div>
      )}
    </div>
  );
}

export default Unscramble;
