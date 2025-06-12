import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../game_over.css";
import { playSound, stopBackgroundMusic, resetMusicState, playBackgroundMusic, stopMusicHealthCheck, musicHealthCheck } from "./sound";

const GameOver = ({
  playerStats,
  tasks = {},
  visitedLocations = new Set(),
  usedItems = new Set(),
  characterName = "manda",
  playerName = "Player",
  isGameOver = false,
  // Add these new props to receive reset functions from parent (Map.jsx)
  onNewGame,
  onMainMenu,
}) => {
  const [animationPhase, setAnimationPhase] = useState("enter");
  const navigate = useNavigate();

  // No longer saving visitedLocations on game over, as it will be reset or managed by parent.
  // useEffect(() => {
  //   if (isGameOver) {
  //     localStorage.setItem("gameVisitedLocations", JSON.stringify([...visitedLocations]));
  //   }
  // }, [isGameOver, visitedLocations]);

  const getActualVisitedLocations = () => {
    // We expect visitedLocations to be passed correctly from parent (Map.jsx)
    // If not, fall back to localStorage (though the goal is to manage centrally now)
    if (visitedLocations && visitedLocations.size) return visitedLocations;
    const stored = JSON.parse(localStorage.getItem("gameVisitedLocations") || "[]");
    return new Set(stored);
  };

  const calculateStatBalance = () => {
    const stats = [playerStats.meal || 0, playerStats.sleep || 0, playerStats.health || 0, playerStats.energy || 0, playerStats.happiness || 0, playerStats.cleanliness || 0];
    const average = stats.reduce((sum, stat) => sum + stat, 0) / 6;
    const totalDeviation = stats.reduce((sum, stat) => sum + Math.abs(stat - average), 0);
    // Adjusted maxPossibleDeviation for 6 stats, each ranging 0-100.
    // Max deviation occurs if half are 0 and half are 100, e.g., three 0s, three 100s.
    // Average would be 50. Deviation for 0 is 50, for 100 is 50. Total 3*50 + 3*50 = 300.
    // Or simpler: (100 - 0) * (number of stats / 2) = 100 * 3 = 300.
    // Let's use 300 as a more robust max deviation for a 0-100 scale across 6 stats.
    const maxPossibleDeviation = 300;
    return Math.max(0, (1 - totalDeviation / maxPossibleDeviation) * 100);
  };

  const calculateActivitiesScore = () => {
    const totalActivities = 22; // Make sure this number is accurate across all locations
    const completed = Object.values(tasks).filter((task) => task.completed).length;
    // Prevent division by zero if totalActivities is 0
    return totalActivities > 0 ? (completed / totalActivities) * 100 : 0;
  };

  const calculateItemsScore = () => {
    const totalItems = 10; // This should reflect the maximum possible unique items a player can collect
    const collected = playerStats.items ? new Set(playerStats.items.map((item) => item.name)).size : 0; // Count unique collected items
    const used = usedItems.size;
    // Weighted average: e.g., 60% for collected, 40% for used
    const collectedScore = (collected / totalItems) * 0.6;
    const usedScore = (used / totalItems) * 0.4;
    return (collectedScore + usedScore) * 100;
  };

  const calculateLocationScore = () => {
    const totalLocations = 5; // Home, Field, Beach, Restaurant, Mountain
    const actualVisitedLocations = getActualVisitedLocations();
    const visited = actualVisitedLocations.size;
    // Ensure score is not NaN if totalLocations is 0
    return totalLocations > 0 ? (visited / totalLocations) * 100 : 0;
  };

  const calculateFinalScore = () => {
    const statBalance = calculateStatBalance();
    const activities = calculateActivitiesScore();
    const items = calculateItemsScore();
    const locations = calculateLocationScore();
    // Sum of weights should be 1
    return statBalance * 0.25 + activities * 0.3 + items * 0.2 + locations * 0.25;
  };

  // Delegate the reset logic to the parent component (Map.jsx)
  const handleNewGameClick = () => {
    if (onNewGame) {
      onNewGame(); // Call the reset function passed from Map.jsx
    } else {
      console.warn("onNewGame prop not provided to GameOver.jsx");
      // Fallback for direct testing if prop is missing
      resetMusicState();
      localStorage.removeItem("gameVisitedLocations");
      localStorage.removeItem("gameState");
      localStorage.removeItem("playerStats");
      localStorage.removeItem("gameProgress");
      playBackgroundMusic();
      musicHealthCheck();
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
      navigate("/map", { state: { characterName, playerName, stats: freshStats }, replace: true });
    }
  };

  const handleMainMenuClick = () => {
    if (onMainMenu) {
      onMainMenu(); // Call the reset function passed from Map.jsx
    } else {
      console.warn("onMainMenu prop not provided to GameOver.jsx");
      // Fallback for direct testing if prop is missing
      resetMusicState();
      localStorage.removeItem("gameVisitedLocations");
      localStorage.removeItem("gameState");
      localStorage.removeItem("playerStats");
      localStorage.removeItem("gameProgress");
      playBackgroundMusic();
      musicHealthCheck();
      navigate("/", { replace: true });
    }
  };

  const finalScore = calculateFinalScore();
  const scoreExpression = (() => {
    if (finalScore >= 90) return "Excellent";
    if (finalScore >= 80) return "Very Good";
    if (finalScore >= 65) return "Good";
    if (finalScore >= 50) return "Average";
    if (finalScore >= 35) return "Poor";
    if (finalScore >= 20) return "Very Poor";
    return "Terrible";
  })();

  const actualVisitedLocationsArray = [...getActualVisitedLocations()]; // Convert Set to Array for rendering

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
    return "Game Over"; // Fallback, though ideally one of the above should be true
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
              <span className="summary-value">{actualVisitedLocationsArray.length}/5</span>
            </div>
          </div>
          <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>Visited: {actualVisitedLocationsArray.length > 0 ? actualVisitedLocationsArray.join(", ") : "None"}</div>
        </div>

        <div className="game-over-actions">
          <button className="action-button new-game-btn" onClick={handleNewGameClick}>
            New Game
          </button>
          <button className="action-button main-menu-btn" onClick={handleMainMenuClick}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
