import React, { useState, useEffect } from "react";
import { Sparkles, PlayCircle, Shield, Hash, User } from "lucide-react";

function Welcome({ user, onStartGame }) {
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Staggered entrance animation
    const t1 = setTimeout(() => setShowContent(true), 300);
    const t2 = setTimeout(() => setShowButton(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="glass-card welcome-card">
      {/* Animated background orbs */}
      <div className="welcome-orb welcome-orb-1"></div>
      <div className="welcome-orb welcome-orb-2"></div>

      {/* Welcome Icon */}
      <div className={`welcome-icon-container ${showContent ? "welcome-visible" : "welcome-hidden"}`}>
        <Sparkles size={36} />
      </div>

      {/* Welcome Text */}
      <div className={`welcome-text-block ${showContent ? "welcome-visible" : "welcome-hidden"}`}>
        <p className="welcome-label">Welcome</p>
        <h1 className="welcome-username">{user.name}</h1>
      </div>

      {/* User Info Card */}
      <div className={`welcome-info-card ${showContent ? "welcome-visible" : "welcome-hidden"}`}>
        <div className="welcome-info-row">
          <div className="welcome-info-icon">
            <User size={16} />
          </div>
          <div className="welcome-info-detail">
            <span className="welcome-info-label">Player Name</span>
            <span className="welcome-info-value">{user.name}</span>
          </div>
        </div>
        <div className="welcome-info-divider"></div>
        <div className="welcome-info-row">
          <div className="welcome-info-icon">
            <Hash size={16} />
          </div>
          <div className="welcome-info-detail">
            <span className="welcome-info-label">Access ID</span>
            <span className="welcome-info-value welcome-id-mono">{user.userId}</span>
          </div>
        </div>
        <div className="welcome-info-divider"></div>
        <div className="welcome-info-row">
          <div className="welcome-info-icon">
            <Shield size={16} />
          </div>
          <div className="welcome-info-detail">
            <span className="welcome-info-label">Status</span>
            <span className="welcome-info-value welcome-status-verified">
              <span className="welcome-verified-dot"></span>
              Verified & Ready
            </span>
          </div>
        </div>
      </div>

      {/* Start Game Button */}
      <div className={`welcome-button-area ${showButton ? "welcome-visible" : "welcome-hidden"}`}>
        <button onClick={onStartGame} className="btn-start-game">
          <div className="btn-start-game-glow"></div>
          <PlayCircle size={22} />
          <span>Enter Game Arena</span>
        </button>
        <p className="welcome-hint">🎮 Choose from 4 exciting games — one shot only!</p>
      </div>
    </div>
  );
}

export default Welcome;
