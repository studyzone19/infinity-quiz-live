import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "./config/api";
import sound from "./utils/sound";
import Register from "./pages/Register";
import Welcome from "./pages/welcome";
import Quiz from "./pages/Quiz";
import TrueFalse from "./pages/TrueFalse";
import Unscramble from "./pages/Unscramble";
import GameHub from "./pages/GameHub";
import Leaderboard from "./components/Leaderboard";
import ScoreDisplay from "./pages/ScoreDisplay";
import GameResultCard from "./components/GameResultCard";
import CameraScanner from "./components/CameraScanner";
import Admin from "./pages/Admin";
import KioskStation from "./pages/KioskStation";
import { QrCode, Lock, ShieldAlert, Tv2, Volume2, VolumeX, Camera, Shield } from "lucide-react";

function App() {
  const [isOnline, setIsOnline] = useState(true);
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  const handleToggleSound = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sound.playCorrect();
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await axios.get(`${API_BASE}/api/health`);
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Top Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "0 8px", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: "1.15rem", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px", fontWeight: "800", letterSpacing: "0.5px" }}>
            <span style={{ fontSize: "1.3rem" }}>♾️</span>
            <span>INFINITY QUIZ LIVE</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: isMuted ? "var(--text-secondary)" : "var(--color-primary)",
              padding: "5px 10px",
              borderRadius: "20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.75rem",
              fontWeight: 600
            }}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{isMuted ? "Muted" : "Sound"}</span>
          </button>

          {/* Admin Link */}
          <Link
            to="/admin"
            title="Organizer Admin Portal"
            style={{
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              padding: "5px 8px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              textDecoration: "none"
            }}
          >
            <Shield size={16} />
          </Link>

          <span className="status-badge" style={{ margin: 0, padding: "4px 10px" }}>
            <span className={`status-dot ${isOnline ? "online" : "offline"}`}></span>
            <span style={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.5px" }}>
              {isOnline ? "Live Connected" : "Connecting..."}
            </span>
          </span>
        </div>
      </div>

      <Routes>
        <Route path="/" element={<RegisterPage />} />
        <Route path="/enter-pass" element={<EnterPassPage />} />
        <Route path="/leaderboard/:gameType" element={<LeaderboardPage />} />
        <Route path="/game1" element={<KioskStation targetGame="quiz" gameName="Game 1 (Quiz)" />} />
        <Route path="/game2" element={<KioskStation targetGame="truefalse" gameName="Game 2 (True/False)" />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  );
}

/* Full-screen root wrapper that bypasses app-container for /display, /top-players, /final-leaderboard, /leaderboard */
function RootApp() {
  const location = useLocation();
  const isDisplay = location.pathname === "/display" || location.pathname === "/top-players" || location.pathname === "/final-leaderboard" || location.pathname === "/leaderboard";

  if (isDisplay) {
    return (
      <Routes>
        <Route path="/display" element={<ScoreDisplayPage cardsOnly={true} />} />
        <Route path="/top-players" element={<ScoreDisplayPage listOnly={true} />} />
        <Route path="/final-leaderboard" element={<ScoreDisplayPage />} />
        <Route path="/leaderboard" element={<ScoreDisplayPage listOnly={true} />} />
      </Routes>
    );
  }

  return <App />;
}

/* ────────────────────────────────
   Score Display Page (full-screen TV mode)
──────────────────────────────── */
function ScoreDisplayPage({ listOnly = false, cardsOnly = false }) {
  return <ScoreDisplay listOnly={listOnly} cardsOnly={cardsOnly} />;
}

/* ────────────────────────────────
   Register Page
──────────────────────────────── */
function RegisterPage() {
  const navigate = useNavigate();

  const handleProceedToQuiz = (registeredUserId) => {
    navigate(`/enter-pass?id=${registeredUserId}`);
  };

  return <Register onProceedToQuiz={handleProceedToQuiz} />;
}

/* ────────────────────────────────
   Enter Pass Page
──────────────────────────────── */
function EnterPassPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [passId, setPassId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [scanError, setScanError] = useState("");
  const [showCamera, setShowCamera] = useState(false);

  // Multi-game state
  const [playedGames, setPlayedGames] = useState([]);          // ["quiz", "truefalse", ...]
  const [gameScores, setGameScores] = useState({});            // { quiz: 200, truefalse: 150 }
  const [selectedGame, setSelectedGame] = useState(null);      // current game being played
  const [gameStarted, setGameStarted] = useState(false);
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [showResult, setShowResult] = useState(false);         // show GameResultCard
  const [lastScore, setLastScore] = useState(0);               // score from just-finished game

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
      // Restore already-played games if user comes back mid-session
      if (response.data.playedGames?.length > 0) {
        setPlayedGames(response.data.playedGames);
        setGameScores(response.data.gameScores || {});
      }
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

  // Welcome → GameHub
  const handleStartGameHub = () => {
    setWelcomeDone(true);
  };

  // GameHub → Selected Game
  const handleSelectGame = (gameId) => {
    setSelectedGame(gameId);
    setGameStarted(true);
    setShowResult(false);
  };

  // Called by each game page when finished — receives final score
  const handleGameFinished = (score) => {
    const updatedPlayed = [...playedGames, selectedGame];
    const updatedScores = { ...gameScores, [selectedGame]: score };
    setPlayedGames(updatedPlayed);
    setGameScores(updatedScores);
    setLastScore(score);
    setGameStarted(false);
    setShowResult(true);    // show GameResultCard
  };

  // GameResultCard → play another game
  const handlePlayNext = (nextGameKey) => {
    setSelectedGame(nextGameKey);
    setGameStarted(true);
    setShowResult(false);
  };

  // Go to leaderboard (user chooses to stop)
  const handleViewLeaderboard = () => {
    setVerifiedUser(null);
    setGameStarted(false);
    setSelectedGame(null);
    setWelcomeDone(false);
    setShowResult(false);
    setPassId("");
    setPlayedGames([]);
    setGameScores({});
    localStorage.removeItem("lastUserId");
    navigate("/leaderboard");
  };

  // ── Show GameResultCard after a game ──
  if (verifiedUser && showResult && selectedGame) {
    return (
      <GameResultCard
        user={verifiedUser}
        justPlayedGame={selectedGame}
        justPlayedScore={lastScore}
        gameScores={gameScores}
        playedGames={playedGames}
        onPlayNext={handlePlayNext}
        onViewLeaderboard={handleViewLeaderboard}
      />
    );
  }

  // ── Game Active ──
  if (verifiedUser && gameStarted && selectedGame) {
    if (selectedGame === "quiz" || selectedGame === "speed") {
      return <Quiz user={verifiedUser} onExit={handleGameFinished} gameType={selectedGame} />;
    }
    if (selectedGame === "truefalse") {
      return <TrueFalse user={verifiedUser} onExit={handleGameFinished} />;
    }
    if (selectedGame === "unscramble") {
      return <Unscramble user={verifiedUser} onExit={handleGameFinished} />;
    }
  }

  // ── Game Hub (after welcome) ──
  if (verifiedUser && welcomeDone && !gameStarted) {
    return <GameHub user={verifiedUser} onSelectGame={handleSelectGame} playedGames={playedGames} gameScores={gameScores} />;
  }

  // ── Welcome Screen ──
  if (verifiedUser && !welcomeDone) {
    return <Welcome user={verifiedUser} onStartGame={handleStartGameHub} />;
  }

  // ── Enter Pass Form ──
  return (
    <div className="glass-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "12px" }}>
        <QrCode size={28} style={{ color: "var(--color-secondary)", animation: "float 3s infinite ease-in-out" }} />
        <h1 className="brand-heading" style={{ margin: 0 }}>Scan Access Pass</h1>
      </div>
      <p className="brand-subheading">
        Provide your game access pass ID to enter the arena and choose your game.
      </p>

      {scanError && (
        <div className="toast">
          <ShieldAlert size={18} />
          <span>{scanError}</span>
        </div>
      )}

      {showCamera ? (
        <CameraScanner
          onScan={(scannedId) => {
            setPassId(scannedId);
            autoVerify(scannedId);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      ) : (
        <div style={{ marginBottom: "20px" }}>
          {/* Scanner Window */}
          <div className="scanner-window" style={{ marginBottom: "14px" }}>
            <div className="scanner-laser"></div>
            <QrCode size={56} style={{ color: "rgba(255,255,255,0.12)", marginBottom: "10px" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>
              Pass Scan Beam Ready
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowCamera(true)}
            className="btn-secondary"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px"
            }}
          >
            <Camera size={18} style={{ color: "var(--color-primary)" }} />
            <span>Scan with Device Camera</span>
          </button>
        </div>
      )}

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
          {verifying ? "Verifying Game Pass..." : "Verify & Enter Arena"}
        </button>
      </form>
    </div>
  );
}

/* ────────────────────────────────
   Leaderboard Page
──────────────────────────────── */
function LeaderboardPage() {
  const { gameType } = useParams();
  return (
    <div className="glass-card">
      <Leaderboard gameFilter={gameType} />
    </div>
  );
}



export { RootApp };
export default RootApp;
