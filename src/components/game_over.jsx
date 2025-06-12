import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../game_over.css";
import { playSound, stopBackgroundMusic, resetMusicState, playBackgroundMusic, stopMusicHealthCheck, musicHealthCheck } from "./sound";

const GameOver = ({ playerStats, tasks = {}, visitedLocations = new Set(), usedItems = new Set(), characterName = "manda", playerName = "Player", onClose, isGameOver = false }) => {
  const [animationPhase, setAnimationPhase] = useState("enter");
  const navigate = useNavigate();

  // FIX: Pastikan visitedLocations mencakup semua lokasi yang mungkin dikunjungi
  const getAllVisitedLocations = () => {
    // Mulai dengan lokasi yang diberikan
    const allLocations = new Set(visitedLocations);

    // Tambahkan lokasi berdasarkan tasks yang completed
    Object.keys(tasks).forEach((taskKey) => {
      if (tasks[taskKey]?.completed) {
        const location = taskKey.split("-")[0]; // ambil nama lokasi dari taskKey
        allLocations.add(location);
      }
    });

    // Tambahkan lokasi berdasarkan items yang ada (beberapa item spesifik lokasi)
    if (playerStats.items) {
      playerStats.items.forEach((item) => {
        if (item.category === "Marine" || item.name.includes("Shell") || item.name.includes("Starfish")) {
          allLocations.add("beach");
        }
        if (item.category === "Flowers" && (item.name === "Rose" || item.name === "Daisy")) {
          allLocations.add("mountain");
        }
        if (item.name === "Takeaway Meal") {
          allLocations.add("restaurant");
        }
        if (item.category === "Rocks") {
          allLocations.add("mountain");
        }
      });
    }

    // Selalu include home karena game dimulai dari sana
    allLocations.add("home");

    return allLocations;
  };

  // Disable all interactions when game over
  useEffect(() => {
    if (isGameOver) {
      stopBackgroundMusic();
      stopMusicHealthCheck();
      playSound("over");

      const disableKeys = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };

      const disableClicks = (e) => {
        if (!e.target.closest(".game-over-container")) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      document.addEventListener("keydown", disableKeys, true);
      document.addEventListener("click", disableClicks, true);
      document.addEventListener("mousedown", disableClicks, true);
      document.addEventListener("mouseup", disableClicks, true);

      return () => {
        document.removeEventListener("keydown", disableKeys, true);
        document.removeEventListener("click", disableClicks, true);
        document.removeEventListener("mousedown", disableClicks, true);
        document.removeEventListener("mouseup", disableClicks, true);
      };
    }
  }, [isGameOver]);

  // Score Calculations
  const calculateStatBalance = () => {
    const stats = [playerStats.meal || 0, playerStats.sleep || 0, playerStats.health || 0, playerStats.energy || 0, playerStats.happiness || 0, playerStats.cleanliness || 0];
    const average = stats.reduce((sum, stat) => sum + stat, 0) / 6;
    const totalDeviation = stats.reduce((sum, stat) => sum + Math.abs(stat - average), 0);
    const maxPossibleDeviation = 167;
    return Math.max(0, (1 - totalDeviation / maxPossibleDeviation) * 100);
  };

  const calculateActivitiesScore = () => {
    const totalActivities = 22;
    const completed = Object.values(tasks).filter((task) => task.completed).length;
    return (completed / totalActivities) * 100;
  };

  const calculateItemsScore = () => {
    const totalItems = 10;
    const collected = playerStats.items ? playerStats.items.length : 0;
    const used = usedItems.size;
    return (collected / totalItems) * 50 + (used / totalItems) * 50;
  };

  const calculateLocationScore = () => {
    const totalLocations = 5;
    const actualVisitedLocations = getAllVisitedLocations(); // Gunakan function yang sudah diperbaiki
    const visited = actualVisitedLocations.size;
    return (visited / totalLocations) * 100;
  };

  const calculateFinalScore = () => {
    const statBalance = calculateStatBalance();
    const activities = calculateActivitiesScore();
    const items = calculateItemsScore();
    const locations = calculateLocationScore();
    return statBalance * 0.25 + activities * 0.3 + items * 0.2 + locations * 0.25;
  };

  const getScoreExpression = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 65) return "Good";
    if (score >= 50) return "Average";
    if (score >= 35) return "Poor";
    if (score >= 20) return "Very Poor";
    return "Terrible";
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const handleNewGame = () => {
    resetMusicState();

    localStorage.removeItem("gameState");
    localStorage.removeItem("playerStats");
    localStorage.removeItem("gameProgress");

    const freshStats = {
      meal: 50,
      sleep: 50,
      health: 80,
      energy: 80,
      happiness: 50,
      cleanliness: 50,
      money: 100,
      experience: 0,
      level: 1,
      skillPoints: 0,
      items: [],
      tasks: {},
      lastVisitedLocation: "home",
    };

    playBackgroundMusic();
    musicHealthCheck();

    navigate("/map", {
      state: {
        characterName,
        playerName,
        stats: freshStats,
      },
      replace: true,
    });
  };

  const handleMainMenu = () => {
    resetMusicState();

    localStorage.removeItem("gameState");
    localStorage.removeItem("playerStats");
    localStorage.removeItem("gameProgress");

    playBackgroundMusic();
    musicHealthCheck();

    navigate("/", { replace: true });
  };

  const finalScore = calculateFinalScore();
  const scoreExpression = getScoreExpression(finalScore);
  const actualVisitedLocations = getAllVisitedLocations(); // Untuk ditampilkan di UI juga

  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationPhase("show-score"), 400);
    const timer2 = setTimeout(() => setAnimationPhase("show-details"), 800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const getGameOverCause = () => {
    if (playerStats.health <= 0) return "Health reached 0%";
    if (playerStats.sleep <= 0) return "Sleep reached 0%";
    return "Game Over";
  };

  return (
    <div className="game-over-overlay">
      <div className={`game-over-container ${animationPhase}`}>
        <div className="game-over-header">
          <h1 className="game-over-title">GAME OVER</h1>
          <p className="game-over-cause">{getGameOverCause()}</p>
        </div>

        <div className="life-satisfaction-section">
          <h2 className="section-title">Life Satisfaction Score</h2>

          <div className="score-display-main">
            <div className="score-circle-large">
              <span className="score-number-large">{Math.round(finalScore)}</span>
              <span className="score-max-large">/100</span>
            </div>

            <div className="score-expression-main">
              <span className="score-text-main">{scoreExpression}</span>
            </div>
          </div>

          <div className="score-breakdown-detailed">
            <div className="breakdown-grid">
              <div className="breakdown-card">
                <h4>Stat Balance</h4>
                <div className="breakdown-score">{Math.round(calculateStatBalance())}</div>
              </div>

              <div className="breakdown-card">
                <h4>Activities</h4>
                <div className="breakdown-score">{Math.round(calculateActivitiesScore())}</div>
              </div>

              <div className="breakdown-card">
                <h4>Items</h4>
                <div className="breakdown-score">{Math.round(calculateItemsScore())}</div>
              </div>

              <div className="breakdown-card">
                <h4>Exploration</h4>
                <div className="breakdown-score">{Math.round(calculateLocationScore())}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="final-stats-section">
          <h3 className="section-title">Adventure Summary</h3>
          <div className="stats-summary-grid">
            <div className="summary-item">
              <span className="summary-label">Level</span>
              <span className="summary-value">{playerStats.level || 1}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total XP</span>
              <span className="summary-value">{Math.round(playerStats.experience || 0)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Skill Points</span>
              <span className="summary-value">{Math.round(playerStats.skillPoints || 0)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Money</span>
              <span className="summary-value">${playerStats.money || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Locations</span>
              <span className="summary-value">{actualVisitedLocations.size}/5</span>
            </div>
          </div>
        </div>

        <div className="game-over-actions">
          <button className="action-button new-game-btn" onClick={handleNewGame}>
            New Game
          </button>
          <button className="action-button main-menu-btn" onClick={handleMainMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
