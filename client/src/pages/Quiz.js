import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE } from "../config/api";
import sound from "../utils/sound";
import { Trophy, ArrowRight, HelpCircle, Check, X, Award, AlertCircle, Zap, Clock } from "lucide-react";

function Quiz({ user, onExit, gameType = "quiz" }) {
  const isSpeedMode = gameType === "speed";
  const TIME_PER_QUESTION = 10;

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);

  const [loading, setLoading] = useState(true);
  const [quizFinished, setQuizFinished] = useState(false);
  const [error, setError] = useState("");

  // Speed mode timer
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const timerRef = useRef(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  // Speed mode: start timer when a new question loads
  useEffect(() => {
    if (!isSpeedMode || loading || quizFinished || answerSubmitted) return;

    setTimeLeft(TIME_PER_QUESTION);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Time's up — force submit with no selection
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentQuestion, loading, quizFinished]);

  const handleTimeUp = () => {
    setAnswerSubmitted(true);
    const newWrong = wrongAnswers + 1;
    setWrongAnswers(newWrong);

    setTimeout(() => {
      if (questions.length > 0 && currentQuestion < questions.length - 1) {
        setCurrentQuestion((q) => q + 1);
        setSelectedAnswer("");
        setAnswerSubmitted(false);
      } else {
        saveScoreAndFinish(score, correctAnswers, newWrong);
      }
    }, 1000);
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_BASE}/api/questions/random`);
      setQuestions(response.data.questions);
    } catch (error) {
      setError("Unable to retrieve quiz questions. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = () => {
    if (!selectedAnswer || answerSubmitted) return;
    clearInterval(timerRef.current);
    setAnswerSubmitted(true);

    const question = questions[currentQuestion];
    let newScore = score;
    let newCorrect = correctAnswers;
    let newWrong = wrongAnswers;

    if (selectedAnswer === question.correctOption) {
      sound.playCorrect();
      newScore = score + 100;
      newCorrect = correctAnswers + 1;
      setScore(newScore);
      setCorrectAnswers(newCorrect);
    } else {
      sound.playWrong();
      newWrong = wrongAnswers + 1;
      setWrongAnswers(newWrong);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer("");
        setAnswerSubmitted(false);
      } else {
        saveScoreAndFinish(newScore, newCorrect, newWrong);
      }
    }, 1000);
  };

  const saveScoreAndFinish = async (finalScore, finalCorrect, finalWrong) => {
    try {
      await axios.post(`${API_BASE}/api/scores`, {
        userId: user.userId,
        name: user.name,
        score: finalScore,
        correct: finalCorrect,
        wrong: finalWrong,
        gameType,
      });
    } catch (error) {
      // Proceed even on error
    } finally {
      sound.playWin();
      setQuizFinished(true);
      // Notify parent with the score so GameResultCard can show
      setTimeout(() => onExit(finalScore), 600);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
        <div className="spin" style={{ border: "4px solid rgba(255,255,255,0.05)", borderTop: "4px solid var(--color-primary)", borderRadius: "50%", width: "40px", height: "40px" }}></div>
        <p style={{ marginTop: "20px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          {isSpeedMode ? "⚡ Loading Speed Quiz..." : "Synchronizing live quiz questions..."}
        </p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="glass-card" style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ color: "var(--color-error)", marginBottom: "16px" }}>
          <AlertCircle size={48} style={{ margin: "0 auto" }} />
        </div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "8px" }}>Load Failed</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "24px" }}>{error}</p>
        <button onClick={loadQuestions} className="btn-primary">Try Again</button>
      </div>
    );
  }

  // ── Finished ── (brief flash, then parent takes over)
  if (quizFinished) {
    const accuracy = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
    const gameLabel = isSpeedMode ? "⚡ Speed Quiz" : "🧠 Classic Quiz";
    return (
      <div className="glass-card success-screen">
        <div className="success-icon-container" style={{ background: "rgba(139,92,246,0.1)", borderColor: "rgba(139,92,246,0.2)", color: "var(--color-primary)" }}>
          <Trophy size={32} />
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>{gameLabel} Completed</div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "4px" }}>Quiz Done!</h1>
        <h2 style={{ color: "var(--color-secondary)", fontSize: "1.3rem", fontWeight: 700, marginBottom: "24px" }}>{user.name}</h2>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "20px", marginBottom: "28px", textAlign: "left" }}>
          {[
            { label: "Final Score", value: `${score} pts`, color: "var(--color-secondary)" },
            { label: "Correct Answers", value: correctAnswers, color: "var(--color-success)" },
            { label: "Wrong Answers", value: wrongAnswers, color: "var(--color-error)" },
            { label: "Accuracy", value: `${accuracy}%`, color: "var(--text-primary)" },
          ].map((row, i, arr) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <span style={{ color: "var(--text-secondary)" }}>{row.label}</span>
              <span style={{ fontWeight: "700", color: row.color, fontSize: "1.1rem" }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          <div className="spin" style={{ border: "3px solid rgba(255,255,255,0.08)", borderTop: "3px solid var(--color-primary)", borderRadius: "50%", width: "18px", height: "18px", flexShrink: 0 }}></div>
          Saving results...
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const options = [
    { key: "A", text: question.optionA },
    { key: "B", text: question.optionB },
    { key: "C", text: question.optionC },
    { key: "D", text: question.optionD },
  ];

  // Timer color
  const timerColor = timeLeft <= 3 ? "#ef4444" : timeLeft <= 6 ? "#f59e0b" : "#10b981";
  const timerProgress = (timeLeft / TIME_PER_QUESTION) * 100;

  return (
    <div className="glass-card">
      {/* Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isSpeedMode ? "12px" : "20px" }}>
        <span className="status-badge" style={{ margin: 0, background: isSpeedMode ? "rgba(245,158,11,0.1)" : "rgba(139,92,246,0.1)", color: isSpeedMode ? "#f59e0b" : "var(--color-primary)", borderColor: isSpeedMode ? "rgba(245,158,11,0.2)" : "rgba(139,92,246,0.2)" }}>
          {isSpeedMode ? <Zap size={14} /> : <HelpCircle size={14} />}
          <span>Question {currentQuestion + 1} of {questions.length}</span>
        </span>
        <span style={{ fontWeight: "700", color: "var(--color-secondary)", fontSize: "1.1rem" }}>{score} pts</span>
      </div>

      {/* Speed Mode Timer */}
      {isSpeedMode && !answerSubmitted && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "5px" }}>
              <Clock size={13} /> Time Left
            </span>
            <span style={{ fontWeight: "800", fontSize: "1.2rem", color: timerColor, transition: "color 0.3s" }}>
              {timeLeft}s
            </span>
          </div>
          <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${timerProgress}%`,
              background: timerColor,
              borderRadius: "99px",
              transition: "width 1s linear, background 0.3s ease",
              boxShadow: `0 0 8px ${timerColor}`,
            }} />
          </div>
        </div>
      )}

      {/* Question */}
      <h3 style={{ fontSize: "1.15rem", fontWeight: "700", lineHeight: "1.5", marginBottom: "20px" }}>
        {question.question}
      </h3>

      {/* Options */}
      <div style={{ marginBottom: "24px" }}>
        {options.map((option) => {
          const isUserSelection = selectedAnswer === option.key;
          const isCorrectOption = option.key === question.correctOption;
          let borderStyle = "var(--border-color)";
          let backgroundStyle = "rgba(255,255,255,0.03)";
          let circleBackground = "rgba(255,255,255,0.06)";
          let circleIcon = null;

          if (answerSubmitted) {
            if (isCorrectOption) {
              borderStyle = "var(--color-success)";
              backgroundStyle = "rgba(16,185,129,0.12)";
              circleBackground = "var(--color-success)";
              circleIcon = <Check size={14} style={{ color: "#fff" }} />;
            } else if (isUserSelection && !isCorrectOption) {
              borderStyle = "var(--color-error)";
              backgroundStyle = "rgba(239,68,68,0.12)";
              circleBackground = "var(--color-error)";
              circleIcon = <X size={14} style={{ color: "#fff" }} />;
            }
          } else if (isUserSelection) {
            borderStyle = isSpeedMode ? "#f59e0b" : "var(--color-primary)";
            backgroundStyle = isSpeedMode ? "rgba(245,158,11,0.15)" : "rgba(139,92,246,0.15)";
            circleBackground = isSpeedMode ? "#f59e0b" : "var(--color-primary)";
          }

          return (
            <div
              key={option.key}
              className={!answerSubmitted ? "option-hover-effect" : ""}
              onClick={() => { if (!answerSubmitted) setSelectedAnswer(option.key); }}
              style={{
                background: backgroundStyle,
                border: `1px solid ${borderStyle}`,
                borderRadius: "14px",
                padding: "14px 16px",
                marginBottom: "10px",
                cursor: !answerSubmitted ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: circleBackground, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.9rem", flexShrink: 0 }}>
                {circleIcon || option.key}
              </span>
              <span style={{ fontSize: "0.95rem", fontWeight: isUserSelection ? "600" : "400", color: isUserSelection ? "#fff" : "var(--text-primary)" }}>
                {option.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Submit / Waiting */}
      {!answerSubmitted ? (
        <button onClick={submitAnswer} className="btn-primary" disabled={!selectedAnswer}
          style={isSpeedMode ? { background: "linear-gradient(135deg, #f59e0b, #ef4444)" } : {}}>
          Submit Answer
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "14px", border: "1px solid var(--border-color)" }}>
          <div className="spin" style={{ border: "3px solid rgba(255,255,255,0.08)", borderTop: "3px solid var(--color-secondary)", borderRadius: "50%", width: "20px", height: "20px", flexShrink: 0 }}></div>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: "500" }}>
            {currentQuestion === questions.length - 1 ? "Saving results..." : "Next question loading..."}
          </span>
        </div>
      )}
    </div>
  );
}

export default Quiz;