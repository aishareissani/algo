import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../game_over.css";

const GameOver = ({ playerStats, tasks = {}, visitedLocations = new Set(), usedItems = new Set(), playtime = 0, characterName = "claire", playerName = "Player", onClose }) => {
  const [animationPhase, setAnimationPhase] = useState("enter");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

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
    const visited = visitedLocations.size;
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
    if (isProcessing) return;
    setIsProcessing(true);
    try {
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
      navigate("/map", {
        state: { characterName, playerName, stats: freshStats },
        replace: true,
      });
    } catch (error) {
      console.error("Error starting new game:", error);
      setIsProcessing(false);
    }
  };

  const handleMainMenu = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error returning to main menu:", error);
      window.location.href = "/";
    }
  };

  const finalScore = calculateFinalScore();
  const scoreExpression = getScoreExpression(finalScore);

  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationPhase("show-score"), 400);
    const timer2 = setTimeout(() => setAnimationPhase("show-details"), 800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="game-over-overlay">
      <div className={`game-over-container ${animationPhase}`}>
        <div className="game-over-header">
          <h1 className="game-over-title">GAME OVER</h1>
          <p className="game-over-cause">Health reached 0%</p>
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
              <span className="summary-label">Playtime</span>
              <span className="summary-value">{formatTime(playtime)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Locations</span>
              <span className="summary-value">{visitedLocations.size}/5</span>
            </div>
          </div>
        </div>

        <div className="game-over-actions">
          <button className={`action-button new-game-btn ${isProcessing ? "processing" : ""}`} onClick={handleNewGame} disabled={isProcessing}>
            {isProcessing ? "Loading..." : "New Game"}
          </button>
          <button className={`action-button main-menu-btn ${isProcessing ? "processing" : ""}`} onClick={handleMainMenu} disabled={isProcessing}>
            {isProcessing ? "Loading..." : "Main Menu"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
