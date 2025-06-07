import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../game_over.css";

const GameOver = ({
  playerStats,
  tasks = {},
  visitedLocations = new Set(),
  usedItems = new Set(),
  playtime = 0,
  characterName = "claire",
  playerName = "Player",
  onClose, // Add this to close the GameOver screen
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [animationPhase, setAnimationPhase] = useState("enter");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  // Calculate Life Satisfaction Score components
  const calculateStatBalance = () => {
    const stats = [playerStats.meal || 0, playerStats.sleep || 0, playerStats.health || 0, playerStats.energy || 0, playerStats.happiness || 0, playerStats.cleanliness || 0];

    const average = stats.reduce((sum, stat) => sum + stat, 0) / 6;
    const totalDeviation = stats.reduce((sum, stat) => sum + Math.abs(stat - average), 0);
    const maxPossibleDeviation = 167;

    return Math.max(0, (1 - totalDeviation / maxPossibleDeviation) * 100);
  };

  const calculateActivitiesScore = () => {
    const totalUniqueActivities = 22;
    const completedActivities = Object.values(tasks).filter((task) => task.completed).length;
    return (completedActivities / totalUniqueActivities) * 100;
  };

  const calculateItemsScore = () => {
    const totalPotentialItems = 10;
    const collectedItems = playerStats.items ? playerStats.items.length : 0;
    const usedItemsCount = usedItems.size;

    const collectionScore = (collectedItems / totalPotentialItems) * 50;
    const usageScore = (usedItemsCount / totalPotentialItems) * 50;

    return collectionScore + usageScore;
  };

  const calculateLocationScore = () => {
    const totalLocations = 5;
    const visitedCount = visitedLocations.size;
    return (visitedCount / totalLocations) * 100;
  };

  const calculateFinalScore = () => {
    const statBalance = calculateStatBalance();
    const activities = calculateActivitiesScore();
    const items = calculateItemsScore();
    const locations = calculateLocationScore();

    return statBalance * 0.25 + activities * 0.3 + items * 0.2 + locations * 0.25;
  };

  const getScoreExpression = (score) => {
    if (score >= 80) return { text: "Excellent", emoji: "🌟" };
    if (score >= 60) return { text: "Good", emoji: "😊" };
    if (score >= 40) return { text: "Average", emoji: "😐" };
    if (score >= 20) return { text: "Poor", emoji: "😔" };
    return { text: "Very Poor", emoji: "😢" };
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#4CAF50";
    if (score >= 60) return "#8BC34A";
    if (score >= 40) return "#FFC107";
    if (score >= 20) return "#FF9800";
    return "#F44336";
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Direct navigation handlers that reset stats
  const handleNewGame = () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      // Create fresh default stats
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

      // Navigate to map with fresh stats
      navigate("/map", {
        state: {
          characterName,
          playerName,
          stats: freshStats,
        },
        replace: true, // Replace current history entry
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
      // Navigate to main menu (loading screen)
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error returning to main menu:", error);
      // Fallback: force reload to root
      window.location.href = "/";
    }
  };

  const finalScore = calculateFinalScore();
  const scoreExpression = getScoreExpression(finalScore);
  const scoreColor = getScoreColor(finalScore);

  useEffect(() => {
    // Animation sequence
    const timer1 = setTimeout(() => setAnimationPhase("show-score"), 1000);
    const timer2 = setTimeout(() => setAnimationPhase("show-details"), 1000);

    // Cleanup timers on unmount
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="game-over-overlay">
      <div className={`game-over-container ${animationPhase}`}>
        {/* Game Over Header */}
        <div className="game-over-header">
          <div className="skull-icon">😵</div>
          <h1 className="game-over-title">ADVENTURE COMPLETE</h1>
          <p className="game-over-cause">Your character's journey has ended!</p>
        </div>

        {/* Life Satisfaction Score */}
        <div className="life-satisfaction-section">
          <h2 className="section-title">Life Satisfaction Score</h2>

          <div className="score-display-main">
            <div className="score-circle-large" style={{ borderColor: scoreColor }}>
              <span className="score-number-large" style={{ color: scoreColor }}>
                {Math.round(finalScore)}
              </span>
              <span className="score-max-large">/100</span>
            </div>

            <div className="score-expression-main">
              <span className="score-emoji">{scoreExpression.emoji}</span>
              <span className="score-text-main" style={{ color: scoreColor }}>
                {scoreExpression.text}
              </span>
            </div>
          </div>

          {/* Score Breakdown Toggle */}
          <button className="breakdown-toggle" onClick={() => setShowBreakdown(!showBreakdown)} disabled={isProcessing}>
            {showBreakdown ? "Hide Details" : "Show Breakdown"}
            <span className={`arrow ${showBreakdown ? "up" : "down"}`}>▼</span>
          </button>

          {/* Detailed Breakdown */}
          {showBreakdown && (
            <div className="score-breakdown-detailed">
              <div className="breakdown-grid">
                <div className="breakdown-card">
                  <h4>Stat Balance</h4>
                  <div className="breakdown-score" style={{ color: getScoreColor(calculateStatBalance()) }}>
                    {Math.round(calculateStatBalance())}
                  </div>
                  <div className="breakdown-weight">25% Weight</div>
                </div>

                <div className="breakdown-card">
                  <h4>Activities</h4>
                  <div className="breakdown-score" style={{ color: getScoreColor(calculateActivitiesScore()) }}>
                    {Math.round(calculateActivitiesScore())}
                  </div>
                  <div className="breakdown-weight">30% Weight</div>
                </div>

                <div className="breakdown-card">
                  <h4>Items</h4>
                  <div className="breakdown-score" style={{ color: getScoreColor(calculateItemsScore()) }}>
                    {Math.round(calculateItemsScore())}
                  </div>
                  <div className="breakdown-weight">20% Weight</div>
                </div>

                <div className="breakdown-card">
                  <h4>Exploration</h4>
                  <div className="breakdown-score" style={{ color: getScoreColor(calculateLocationScore()) }}>
                    {Math.round(calculateLocationScore())}
                  </div>
                  <div className="breakdown-weight">25% Weight</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Final Stats Summary */}
        <div className="final-stats-section">
          <h3 className="section-title">Adventure Summary</h3>
          <div className="stats-summary-grid">
            <div className="summary-item">
              <span className="summary-label">Final Level</span>
              <span className="summary-value">{playerStats.level || 1}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total XP</span>
              <span className="summary-value">{playerStats.experience || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Skill Points</span>
              <span className="summary-value">{playerStats.skillPoints || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Money Earned</span>
              <span className="summary-value">${playerStats.money || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Playtime</span>
              <span className="summary-value">{formatTime(playtime)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Locations Visited</span>
              <span className="summary-value">{visitedLocations.size}/5</span>
            </div>
          </div>
        </div>

        {/* Encouragement Message */}
        <div className="encouragement-section">
          <p className="encouragement-text">Every ending is a new beginning. Start fresh and aim for a higher Life Satisfaction Score!</p>
        </div>

        {/* Action Buttons */}
        <div className="game-over-actions">
          <button className={`action-button new-game-btn ${isProcessing ? "processing" : ""}`} onClick={handleNewGame} disabled={isProcessing}>
            <span className="button-icon">🔄</span>
            {isProcessing ? "Loading..." : "Start New Adventure"}
          </button>
          <button className={`action-button main-menu-btn ${isProcessing ? "processing" : ""}`} onClick={handleMainMenu} disabled={isProcessing}>
            <span className="button-icon">🏠</span>
            {isProcessing ? "Loading..." : "Return to Main Menu"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
