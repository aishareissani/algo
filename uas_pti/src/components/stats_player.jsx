// stats_player.jsx
import React, { useState, useEffect } from "react";
import "../stats.css";

function StatsPlayer({ stats = {}, onStatsUpdate }) {
  const { meal = 50, sleep = 50, health = 100, energy = 100, happiness = 50, cleanliness = 50, money = 100, experience = 0, level = 1, skillPoints = 0, items = [] } = stats;

  const [showInventory, setShowInventory] = useState(false);

  // Stat decay effect - decrease stats by 5 every 10 seconds
  useEffect(() => {
    if (!onStatsUpdate) return; // Only run if callback is provided

    const interval = setInterval(() => {
      onStatsUpdate((prevStats) => ({
        ...prevStats,
        meal: Math.max(0, prevStats.meal - 5),
        sleep: Math.max(0, prevStats.sleep - 5),
        energy: Math.max(0, prevStats.energy - 5),
        cleanliness: Math.max(0, prevStats.cleanliness - 5),
        // Health decays faster if meal or sleep is low
        health: Math.max(0, prevStats.health - (prevStats.meal <= 20 || prevStats.sleep <= 20 ? 10 : 5)),
        happiness: Math.max(0, prevStats.happiness - 5),
      }));
    }, 2500); // 2.5 seconds

    return () => clearInterval(interval);
  }, [onStatsUpdate]);

  const getStatusColor = (value) => {
    if (value <= 25) return "critical";
    if (value <= 50) return "warning";
    return "good";
  };

  return (
    <div className="stats-card" role="region" aria-label="Player status">
      <div className="stats-header">
        <h3>PLAYER STATUS</h3>
        <div className="level-badge">LVL {level}</div>
      </div>

      <div className="stats-grid">
        <div className={`stat-container ${getStatusColor(health)}`}>
          <div className="stat-icon health-icon"></div>
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Health</span>
              <span className="stat-value">{health}%</span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${health}%` }} role="progressbar" aria-valuenow={health} aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>

        <div className={`stat-container ${getStatusColor(energy)}`}>
          <div className="stat-icon energy-icon"></div>
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Energy</span>
              <span className="stat-value">{energy}%</span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${energy}%` }} role="progressbar" aria-valuenow={energy} aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>

        <div className={`stat-container ${getStatusColor(meal)}`}>
          <div className="stat-icon meal-icon"></div>
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Hunger</span>
              <span className="stat-value">{meal}%</span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${meal}%` }} role="progressbar" aria-valuenow={meal} aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>

        <div className={`stat-container ${getStatusColor(sleep)}`}>
          <div className="stat-icon sleep-icon"></div>
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Sleep</span>
              <span className="stat-value">{sleep}%</span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${sleep}%` }} role="progressbar" aria-valuenow={sleep} aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>

        <div className={`stat-container mood ${getStatusColor(happiness)}`}>
          <div className={`stat-icon mood-icon mood-${getStatusColor(happiness)}`}></div>
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Mood</span>
              <span className="stat-value">{happiness}%</span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill mood-bar" style={{ width: `${happiness}%` }} role="progressbar" aria-valuenow={happiness} aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>

        <div className={`stat-container ${getStatusColor(cleanliness)}`}>
          <div className="stat-icon clean-icon"></div>
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Clean</span>
              <span className="stat-value">{cleanliness}%</span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${cleanliness}%` }} role="progressbar" aria-valuenow={cleanliness} aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-footer">
        <div className="resources">
          <div className="resource-item">
            <div className="resource-icon money-icon"></div>
            <span className="resource-value">${money}</span>
          </div>

          <div className="resource-item">
            <div className="resource-icon xp-icon"></div>
            <span className="resource-value">{experience} XP</span>
          </div>

          <div className="resource-item">
            <div className="resource-icon skill-icon"></div>
            <span className="resource-value">{skillPoints} SP</span>
          </div>
        </div>

        <button onClick={() => setShowInventory((prev) => !prev)} aria-expanded={showInventory} aria-controls="inventory-panel" className="inventory-button">
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
