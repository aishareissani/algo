import React, { useState, useEffect, useRef } from "react";
import "../stats.css";
import { useSpeedMode } from "./speed";

function StatsPlayer({ stats = {}, onStatsUpdate, onResetStats }) {
  // Destructure stats object
  const { meal = 50, sleep = 50, health = 80, energy = 80, happiness = 50, cleanliness = 50, money = 100, experience = 0, level = 1, skillPoints = 0, items = [] } = stats;

  const [showInventory, setShowInventory] = useState(false);
  const [increasedIndicators, setIncreasedIndicators] = useState({});
  const [decreasedIndicators, setDecreasedIndicators] = useState({});
  const prevStatsRef = useRef();
  const { isFastForward } = useSpeedMode(); // Assuming this adjusts the interval speed

  // Helper function to determine status color
  const getStatusColor = (v) => (v <= 25 ? "critical" : v <= 50 ? "warning" : "good");

  // Indicator component for UI feedback
  const Indicator = ({ statKey }) => (
    <>
      {increasedIndicators[statKey] && <span className="stat-increase-indicator">+</span>}
      {decreasedIndicators[statKey] && <span className="stat-decrease-indicator">-</span>}
    </>
  );

  // Track changes in stats over time
  useEffect(() => {
    const prev = prevStatsRef.current;
    if (prev) {
      const keys = ["meal", "sleep", "health", "energy", "happiness", "cleanliness", "money", "experience", "level", "skillPoints"];
      const increase = {},
        decrease = {};

      keys.forEach((key) => {
        if (stats[key] > prev[key]) increase[key] = true;
        else if (stats[key] < prev[key]) decrease[key] = true;
      });

      // Clear indicators after 1.5 seconds
      if (Object.keys(increase).length) {
        Object.keys(increase).forEach((key) =>
          setTimeout(() => {
            setIncreasedIndicators((prev) => {
              const copy = { ...prev };
              delete copy[key];
              return copy;
            });
          }, 1500)
        );
      }

      if (Object.keys(decrease).length) {
        Object.keys(decrease).forEach((key) =>
          setTimeout(() => {
            setDecreasedIndicators((prev) => {
              const copy = { ...prev };
              delete copy[key];
              return copy;
            });
          }, 1500)
        );
      }

      setIncreasedIndicators(increase);
      setDecreasedIndicators(decrease);
    }

    prevStatsRef.current = { ...stats };
  }, [stats]);

  // Simulate degradation for specific stats every 15 seconds
  useEffect(() => {
    const interval = setInterval(
      () => {
        // Merge the current stats with the updated values,
        // so properties like money aren't overwritten.
        const newStats = {
          ...stats, // Take all existing properties including money
          health: Math.max(0, stats.health - 2),
          meal: Math.max(0, stats.meal - 2),
          sleep: Math.max(0, stats.sleep - 1),
          energy: Math.max(0, stats.energy - 1),
          happiness: Math.max(0, stats.happiness - 1),
          cleanliness: Math.max(0, stats.cleanliness - 1),
        };

        if (onStatsUpdate) {
          onStatsUpdate(newStats);
        }
      },
      isFastForward ? 5000 : 15000
    );

    return () => clearInterval(interval);
  }, [stats, onStatsUpdate, isFastForward]);

  return (
    <div className="stats-card" role="region" aria-label="Player status">
      <div className="stats-header">
        <h3>PLAYER STATUS</h3>
        <div className="level-badge">
          LVL {level}
          <Indicator statKey="level" />
        </div>
      </div>
      <div className="stats-grid">
        {/* Stats grid for health */}
        <div className={`stat-container ${getStatusColor(health)}`}>
          <div className="stat-icon health-icon" />
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Health</span>
              <span className="stat-value">
                <Indicator statKey="health" />
                {health}%
              </span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${health}%` }} />
            </div>
          </div>
        </div>

        {/* Energy */}
        <div className={`stat-container ${getStatusColor(energy)}`}>
          <div className="stat-icon energy-icon" />
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Energy</span>
              <span className="stat-value">
                <Indicator statKey="energy" />
                {energy}%
              </span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${energy}%` }} />
            </div>
          </div>
        </div>

        {/* Hunger */}
        <div className={`stat-container ${getStatusColor(meal)}`}>
          <div className="stat-icon meal-icon" />
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Hunger</span>
              <span className="stat-value">
                <Indicator statKey="meal" /> {meal}%
              </span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${meal}%` }} />
            </div>
          </div>
        </div>

        {/* Sleep */}
        <div className={`stat-container ${getStatusColor(sleep)}`}>
          <div className="stat-icon sleep-icon" />
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Sleep</span>
              <span className="stat-value">
                <Indicator statKey="sleep" />
                {sleep}%
              </span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${sleep}%` }} />
            </div>
          </div>
        </div>

        {/* Mood */}
        <div className={`stat-container mood ${getStatusColor(happiness)}`}>
          <div className={`stat-icon mood-icon mood-${getStatusColor(happiness)}`} />
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Mood</span>
              <span className="stat-value">
                <Indicator statKey="happiness" />
                {happiness}%
              </span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill mood-bar" style={{ width: `${happiness}%` }} />
            </div>
          </div>
        </div>

        {/* Cleanliness */}
        <div className={`stat-container ${getStatusColor(cleanliness)}`}>
          <div className="stat-icon clean-icon" />
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Clean</span>
              <span className="stat-value">
                <Indicator statKey="cleanliness" />
                {cleanliness}%
              </span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${cleanliness}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer with resources */}
      <div className="stats-footer">
        <div className="resources">
          <div className="resource-item">
            <div className="resource-icon money-icon" />
            <span className="resource-value">
              <Indicator statKey="money" />${money}
            </span>
          </div>
          <div className="resource-item">
            <div className="resource-icon xp-icon" />
            <span className="resource-value">
              <Indicator statKey="experience" />
              {experience} XP
            </span>
          </div>
          <div className="resource-item">
            <div className="resource-icon skill-icon" />
            <span className="resource-value">
              <Indicator statKey="skillPoints" />
              {skillPoints} SP
            </span>
          </div>
        </div>
        <button onClick={() => (window.location.href = "/items")} className={`inventory-button stats-inventory-button`}>
          <div className="inventory-icon" />
          <span>ITEMS</span>
        </button>
      </div>
    </div>
  );
}

export default StatsPlayer;
