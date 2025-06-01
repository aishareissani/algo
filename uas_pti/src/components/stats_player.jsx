import "../stats.css";
import React, { useState, useEffect, useRef } from "react";
import { useSpeedMode } from "./speed";

function StatsPlayer({ stats = {}, onStatsUpdate, onResetStats }) {
  const { meal = 50, sleep = 50, health = 80, energy = 80, happiness = 50, cleanliness = 50, money = 100, experience = 0, level = 1, skillPoints = 0, items = [] } = stats;

  const [showInventory, setShowInventory] = useState(false);
  const [increasedIndicators, setIncreasedIndicators] = useState({});
  const [decreasedIndicators, setDecreasedIndicators] = useState({});
  const prevStatsRef = useRef();
  const { isFastForward } = useSpeedMode();

  const getStatusColor = (v) => (v <= 25 ? "critical" : v <= 50 ? "warning" : "good");
  const Indicator = ({ statKey }) => (
    <>
      {increasedIndicators[statKey] && <span className="stat-increase-indicator">+</span>}
      {decreasedIndicators[statKey] && <span className="stat-decrease-indicator">-</span>}
    </>
  );

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

      if (Object.keys(increase).length)
        Object.keys(increase).forEach((key) =>
          setTimeout(
            () =>
              setIncreasedIndicators((prev) => {
                const copy = { ...prev };
                delete copy[key];
                return copy;
              }),
            1500
          )
        );
      if (Object.keys(decrease).length)
        Object.keys(decrease).forEach((key) =>
          setTimeout(
            () =>
              setDecreasedIndicators((prev) => {
                const copy = { ...prev };
                delete copy[key];
                return copy;
              }),
            1500
          )
        );
      setIncreasedIndicators(increase);
      setDecreasedIndicators(decrease);
    }
    prevStatsRef.current = { ...stats };
  }, [stats]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newStats = {
        health: Math.max(0, health - 2),
        meal: Math.max(0, meal - 2),
        sleep: Math.max(0, sleep - 1),
        energy: Math.max(0, energy - 1),
        happiness: Math.max(0, happiness - 1),
        cleanliness: Math.max(0, cleanliness - 1),
      };

      if (onStatsUpdate) {
        onStatsUpdate(newStats);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [meal, sleep, energy, happiness, cleanliness, onStatsUpdate]);

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
        <div className={`stat-container ${getStatusColor(meal)}`}>
          <div className="stat-icon meal-icon" />
          <div className="stat-bar-container">
            <div className="stat-label">
              <span>Hunger</span>
              <span className="stat-value">
                <Indicator statKey="meal" />
                {meal}%
              </span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: `${meal}%` }} />
            </div>
          </div>
        </div>
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
      <div className="stats-footer">
        <div className="resources">
          <div className="resource-item">
            <div className="resource-icon money-icon"></div>
            <span className="resource-value">
              <Indicator statKey="money" />${money}
            </span>
          </div>
          <div className="resource-item">
            <div className="resource-icon xp-icon"></div>
            <span className="resource-value">
              <Indicator statKey="experience" />
              {experience} XP
            </span>
          </div>
          <div className="resource-item">
            <div className="resource-icon skill-icon"></div>
            <span className="resource-value">
              <Indicator statKey="skillPoints" />
              {skillPoints} SP
            </span>
          </div>
        </div>
        <button onClick={() => (window.location.href = "/items")} className={`inventory-button stats-inventory-button`}>
          <div className="inventory-icon"></div>
          <span>ITEMS</span>
        </button>
      </div>
    </div>
  );
}

export default StatsPlayer;
