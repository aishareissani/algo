// stats_player.jsx
import React, { useState, useEffect, useRef } from "react";
import "../stats.css"; // Assuming your stats.css is correctly linked

function StatsPlayer({ stats = {}, onStatsUpdate }) {
  const { meal = 50, sleep = 50, health = 80, energy = 80, happiness = 50, cleanliness = 50, money = 100, experience = 0, level = 1, skillPoints = 0, items = [] } = stats;

  const [showInventory, setShowInventory] = useState(false);
  const [increasedIndicators, setIncreasedIndicators] = useState({});
  const prevStatsRef = useRef();

  useEffect(() => {
    const currentStats = stats;
    const previousStats = prevStatsRef.current;

    if (previousStats) {
      const updates = {};
      let hasIncreases = false;

      // Define which stats we want to track for increases
      const trackableStats = ["meal", "sleep", "health", "energy", "happiness", "cleanliness", "money", "experience", "level", "skillPoints"];

      trackableStats.forEach((key) => {
        if (typeof currentStats[key] === "number" && typeof previousStats[key] === "number") {
          if (currentStats[key] > previousStats[key]) {
            updates[key] = true;
            hasIncreases = true;
          }
        }
      });

      if (hasIncreases) {
        setIncreasedIndicators((prevIndicators) => ({
          ...prevIndicators,
          ...updates,
        }));

        Object.keys(updates).forEach((keyToClear) => {
          setTimeout(() => {
            setIncreasedIndicators((prev) => {
              const newIndicatorsState = { ...prev };
              delete newIndicatorsState[keyToClear];
              return newIndicatorsState;
            });
          }, 1500); // Display "+" for 1.5 seconds
        });
      }
    }

    // Store a deep copy of current stats for the next comparison
    prevStatsRef.current = { ...currentStats };
  }, [stats]);

  const getStatusColor = (value) => {
    if (value <= 25) return "critical";
    if (value <= 50) return "warning";
    return "good";
  };

  const IncreaseIndicator = ({ statKey }) => {
    if (increasedIndicators[statKey]) {
      return <span className="stat-increase-indicator">+</span>;
    }
    return null;
  };

  return (
    <div className="stats-card" role="region" aria-label="Player status">
      <div className="stats-header">
        <h3>PLAYER STATUS</h3>
        <div className="level-badge">
          LVL {level} <IncreaseIndicator statKey="level" />
        </div>
      </div>

      <div className="stats-grid">
        {/* Health */}
        <div className={`stat-container ${getStatusColor(health)}`}>
          <div className="stat-icon health-icon"></div>
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Health</span>
              <span className="stat-value">
                <IncreaseIndicator statKey="health" />
                {health}%
              </span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${health}%` }} role="progressbar" aria-valuenow={health} aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>

        {/* Energy */}
        <div className={`stat-container ${getStatusColor(energy)}`}>
          <div className="stat-icon energy-icon"></div>
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Energy</span>
              <span className="stat-value">
                <IncreaseIndicator statKey="energy" />
                {energy}%
              </span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${energy}%` }} role="progressbar" aria-valuenow={energy} aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>

        {/* Hunger (Meal) */}
        <div className={`stat-container ${getStatusColor(meal)}`}>
          <div className="stat-icon meal-icon"></div>
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Hunger</span>
              <span className="stat-value">
                <IncreaseIndicator statKey="meal" />
                {meal}%
              </span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${meal}%` }} role="progressbar" aria-valuenow={meal} aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>

        {/* Sleep */}
        <div className={`stat-container ${getStatusColor(sleep)}`}>
          <div className="stat-icon sleep-icon"></div>
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Sleep</span>
              <span className="stat-value">
                <IncreaseIndicator statKey="sleep" />
                {sleep}%
              </span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${sleep}%` }} role="progressbar" aria-valuenow={sleep} aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>

        {/* Mood (Happiness) */}
        <div className={`stat-container mood ${getStatusColor(happiness)}`}>
          <div className={`stat-icon mood-icon mood-${getStatusColor(happiness)}`}></div>
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Mood</span>
              <span className="stat-value">
                <IncreaseIndicator statKey="happiness" />
                {happiness}%
              </span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill mood-bar" style={{ width: `${happiness}%` }} role="progressbar" aria-valuenow={happiness} aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>

        {/* Cleanliness */}
        <div className={`stat-container ${getStatusColor(cleanliness)}`}>
          <div className="stat-icon clean-icon"></div>
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Clean</span>
              <span className="stat-value">
                <IncreaseIndicator statKey="cleanliness" />
                {cleanliness}%
              </span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${cleanliness}%` }} role="progressbar" aria-valuenow={cleanliness} aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-footer">
        <div className="resources">
          {/* Resource Money */}
          <div className="resource-item">
            <div className="resource-icon money-icon"></div>
            <span className="resource-value">
              <IncreaseIndicator statKey="money" /> ${money}
            </span>
          </div>

          {/* Resource XP */}
          <div className="resource-item">
            <div className="resource-icon xp-icon"></div>
            <span className="resource-value">
              <IncreaseIndicator statKey="experience" /> {experience} XP
            </span>
          </div>

          {/* Resource SP */}
          <div className="resource-item">
            <div className="resource-icon skill-icon"></div>
            <span className="resource-value">
              <IncreaseIndicator statKey="skillPoints" /> {skillPoints} SP
            </span>
          </div>
        </div>

        {/* Inventory Button */}
        <button onClick={() => setShowInventory((prev) => !prev)} aria-expanded={showInventory} aria-controls="inventory-panel" className={`inventory-button ${showInventory ? "active" : ""}`}>
          <div className="inventory-icon"></div>
          <span>{showInventory ? "CLOSE" : "ITEMS"}</span>
        </button>
      </div>

      {showInventory && (
        <div id="inventory-panel" className="inventory-panel">
          <h4>INVENTORY</h4>
          <div className="inventory-grid">
            {Array.isArray(items) && items.length > 0 ? (
              items.map(({ id, name, quantity = 1, type, equipped }, index) => (
                <div key={id || index} className={`inventory-item ${equipped ? "equipped" : ""}`}>
                  <div className="item-icon" title={type}></div>
                  <div className="item-details">
                    <span className="item-name">{name}</span>
                    <div className="item-meta">
                      {quantity > 1 && <span className="item-quantity">x{quantity}</span>}
                      {equipped && <span className="item-equipped">equipped</span>}
                      <span className="item-type">{type}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-inventory">No items in inventory</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatsPlayer;
