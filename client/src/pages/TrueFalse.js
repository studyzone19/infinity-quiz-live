import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../config/api";
import sound from "../utils/sound";
import { Trophy, ArrowRight, CheckSquare, X, AlertCircle, Check } from "lucide-react";
const POINTS_PER_CORRECT = 50;

function TrueFalse({ user, onExit }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // 1 = True, 0 = False
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null); // "correct" | "wrong"

  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);

  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/api/questions/truefalse`);
      setQuestions(res.data.questions);
    } catch (e) {
      setError("Failed to load True/False questions. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = (answer) => {
    if (answerSubmitted) return;
    setSelectedAnswer(answer);
    setAnswerSubmitted(true);

    const question = questions[currentQuestion];
    const isCorrect = answer === question.answer;

    let newScore = score;
    let newCorrect = correctAnswers;
    let newWrong = wrongAnswers;

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

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setAnswerSubmitted(false);
        setFeedback(null);
      } else {
        saveAndFinish(newScore, newCorrect, newWrong);
      }
    }, 1200);
  };

  const saveAndFinish = async (finalScore, finalCorrect, finalWrong) => {
    try {
      await axios.post(`${API_BASE}/api/scores`, {
        userId: user.userId,
        name: user.name,
        score: finalScore,
        correct: finalCorrect,
        wrong: finalWrong,
        gameType: "truefalse",
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
        <div className="spin" style={{ border: "4px solid rgba(255,255,255,0.05)", borderTop: "4px solid #10b981", borderRadius: "50%", width: "40px", height: "40px" }}></div>
        <p style={{ marginTop: "20px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>🎯 Loading True or False...</p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="glass-card" style={{ textAlign: "center", padding: "40px" }}>
        <AlertCircle size={48} style={{ color: "var(--color-error)", margin: "0 auto 16px" }} />
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "8px" }}>Load Failed</h3>
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
        <div className="success-icon-container" style={{ background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.2)", color: "#10b981" }}>
          <Trophy size={32} />
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>🎯 True or False Completed</div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "4px" }}>Well Done!</h1>
        <h2 style={{ color: "#10b981", fontSize: "1.3rem", fontWeight: 700, marginBottom: "24px" }}>{user.name}</h2>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "20px", marginBottom: "28px", textAlign: "left" }}>
          {[
            { label: "Final Score", value: `${score} pts`, color: "#10b981" },
            { label: "Correct", value: `${correctAnswers} / ${questions.length}`, color: "var(--color-success)" },
            { label: "Wrong", value: wrongAnswers, color: "var(--color-error)" },
            { label: "Accuracy", value: `${accuracy}%`, color: "var(--text-primary)" },
          ].map((row, i, arr) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <span style={{ color: "var(--text-secondary)" }}>{row.label}</span>
              <span style={{ fontWeight: "700", color: row.color, fontSize: "1.1rem" }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          <div className="spin" style={{ border: "3px solid rgba(255,255,255,0.08)", borderTop: "3px solid #10b981", borderRadius: "50%", width: "18px", height: "18px", flexShrink: 0 }}></div>
          Saving results...
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="glass-card">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <span className="status-badge" style={{ margin: 0, background: "rgba(16,185,129,0.1)", color: "#10b981", borderColor: "rgba(16,185,129,0.25)" }}>
          <CheckSquare size={14} />
          <span>Q{currentQuestion + 1} of {questions.length}</span>
        </span>
        <span style={{ fontWeight: "700", color: "#10b981", fontSize: "1.1rem" }}>{score} pts</span>
      </div>

      {/* Progress Bar */}
      <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", marginBottom: "24px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "#10b981", borderRadius: "99px", transition: "width 0.4s ease", boxShadow: "0 0 8px #10b981" }} />
      </div>

      {/* Statement */}
      <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "18px", padding: "24px", marginBottom: "28px", textAlign: "center" }}>
        <div style={{ fontSize: "0.7rem", color: "#10b981", textTransform: "uppercase", letterSpacing: "2px", fontWeight: "700", marginBottom: "12px" }}>
          Statement
        </div>
        <p style={{ fontSize: "1.15rem", fontWeight: "700", lineHeight: "1.6", color: "var(--text-primary)" }}>
          {question.statement}
        </p>
      </div>

      {/* Feedback Overlay */}
      {answerSubmitted && (
        <div style={{
          textAlign: "center",
          padding: "12px",
          borderRadius: "14px",
          marginBottom: "16px",
          background: feedback === "correct" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
          border: `1px solid ${feedback === "correct" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          fontSize: "1rem",
          fontWeight: "700",
          color: feedback === "correct" ? "#10b981" : "#ef4444",
          animation: "fadeIn 0.3s ease"
        }}>
          {feedback === "correct" ? <Check size={20} /> : <X size={20} />}
          {feedback === "correct" ? "Correct! ✓" : `Wrong! The answer is: ${question.answer === 1 ? "TRUE" : "FALSE"}`}
        </div>
      )}

      {/* True / False Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        {[
          { label: "TRUE", value: 1, icon: Check, activeColor: "#10b981", activeBg: "rgba(16,185,129,0.2)", emoji: "✅" },
          { label: "FALSE", value: 0, icon: X, activeColor: "#ef4444", activeBg: "rgba(239,68,68,0.2)", emoji: "❌" },
        ].map((btn) => {
          const isSelected = selectedAnswer === btn.value;
          const isCorrectBtn = answerSubmitted && question.answer === btn.value;
          const isWrongBtn = answerSubmitted && isSelected && question.answer !== btn.value;

          let bg = "rgba(255,255,255,0.03)";
          let border = "var(--border-color)";
          let color = "var(--text-primary)";

          if (!answerSubmitted && isSelected) {
            bg = btn.activeBg;
            border = btn.activeColor;
            color = btn.activeColor;
          } else if (answerSubmitted) {
            if (isCorrectBtn) { bg = btn.activeBg; border = btn.activeColor; color = btn.activeColor; }
            if (isWrongBtn) { bg = "rgba(239,68,68,0.15)"; border = "#ef4444"; color = "#ef4444"; }
          }

          return (
            <button
              key={btn.value}
              onClick={() => submitAnswer(btn.value)}
              disabled={answerSubmitted}
              style={{
                padding: "22px 16px",
                background: bg,
                border: `2px solid ${border}`,
                borderRadius: "18px",
                color,
                fontFamily: "inherit",
                fontSize: "1.1rem",
                fontWeight: "800",
                cursor: answerSubmitted ? "default" : "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.25s ease",
                letterSpacing: "1px",
              }}
            >
              <span style={{ fontSize: "2rem" }}>{btn.emoji}</span>
              {btn.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TrueFalse;
