import React, { useState, useEffect, useRef } from "react";
import "../stats.css";
import { useSpeedMode } from "./speed";
import Inventory from "./inventory";

function StatsPlayer({ stats = {}, onStatsUpdate, onResetStats, onUseItem }) {
  // Destructure stats object
  const { meal = 50, sleep = 50, health = 80, energy = 80, happiness = 50, cleanliness = 50, money = 100, experience = 0, level = 1, skillPoints = 0, items = [] } = stats;

  const [showInventory, setShowInventory] = useState(false);
  const [increasedIndicators, setIncreasedIndicators] = useState({});
  const [decreasedIndicators, setDecreasedIndicators] = useState({});
  const [levelUpAnimation, setLevelUpAnimation] = useState(false);
  const [xpGainAnimation, setXpGainAnimation] = useState(false);
  const prevStatsRef = useRef();
  const { isFastForward } = useSpeedMode();

  const [hoveredStat, setHoveredStat] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const statRefs = useRef({});

  // Helper function to determine status color
  const getStatusColor = (v) => (v <= 25 ? "critical" : v <= 50 ? "warning" : "good");

  // Indicator component for UI feedback
  const Indicator = ({ statKey }) => (
    <>
      {increasedIndicators[statKey] && <span className="stat-increase-indicator">+</span>}
      {decreasedIndicators[statKey] && <span className="stat-decrease-indicator">-</span>}
    </>
  );

  const STAT_DESCRIPTIONS = {
    health: {
      title: "Health",
      description: "Your overall physical well-being. Maintain it by resting and avoiding harmful activities.",
    },
    energy: {
      title: "Energy",
      description: "Determines how much you can do before getting tired. Replenish by sleeping and eating.",
    },
    meal: {
      title: "Hunger",
      description: "Indicates how hungry you are. Keep it high by eating regularly.",
    },
    sleep: {
      title: "Sleep",
      description: "Your restfulness. Sleep regularly to maintain good health and energy.",
    },
    happiness: {
      title: "Mood",
      description: "Your emotional state. Boost it by doing enjoyable activities.",
    },
    cleanliness: {
      title: "Cleanliness",
      description: "Your personal hygiene. Keep it high by bathing regularly.",
    },
    money: {
      title: "Money",
      description: "Currency for buying items. Earn by working or selling items.",
    },
    experience: {
      title: "Experience (XP)",
      description: "Gained from activities. Every 5 XP increases your level.",
    },
    skillPoints: {
      title: "Skill Points (SP)",
      description: "Gained from special activities. Every 5 SP increases your level.",
    },
  };

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

      // Check for XP gain animation
      if (stats.experience > prev.experience) {
        setXpGainAnimation(true);
        setTimeout(() => setXpGainAnimation(false), 1000);
      }

      const baseLevel = 1;
      const xpLevels = Math.floor(stats.experience / 5);
      const spLevels = Math.floor(stats.skillPoints / 5);
      const calculatedLevel = baseLevel + xpLevels + spLevels;

      if (calculatedLevel > stats.level) {
        // Trigger level up animation
        setLevelUpAnimation(true);
        setTimeout(() => setLevelUpAnimation(false), 2000);

        onStatsUpdate({
          ...stats,
          level: calculatedLevel,
        });
      }
    }

    prevStatsRef.current = { ...stats };
  }, [stats, onStatsUpdate]);

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

  const handleInventoryClick = () => {
    setShowInventory(true);
  };

  const handleCloseInventory = () => {
    setShowInventory(false);
  };

  // Calculate XP progress to next level
  const xpForNextLevel = 5;
  const currentLevelXP = (level - 1) * 5;

  const handleStatHover = (statKey, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 10,
    });
    setHoveredStat(statKey);
  };

  return (
    <>
      <div className="stats-card" role="region" aria-label="Player status">
        <div className="stats-header">
          <h3>PLAYER STATUS</h3>
          <div className={`level-badge ${levelUpAnimation ? "level-up-animation" : ""}`}>
            LVL&nbsp;<span className={increasedIndicators.level ? "level-number-animated" : ""}>{level}</span>
            <Indicator statKey="level" />
          </div>
        </div>
        <div className="stats-grid">
          {/* Health */}
          <div className={`stat-container ${getStatusColor(health)}`} onMouseEnter={(e) => handleStatHover("health", e)} onMouseLeave={() => setHoveredStat(null)} ref={(ref) => (statRefs.current["health"] = ref)}>
            <div className="stat-icon health-icon" />
            <div className="stat-bar-container">
              <div className="stat-label">
                <span>Health</span>
                <span className="stat-value">
                  <Indicator statKey="health" />
                  {Math.round(health)}%
                </span>
              </div>
              <div className="stat-bar">
                <div className="stat-bar-fill" style={{ width: `${health}%` }} />
              </div>
            </div>
          </div>

          {/* Energy */}
          <div className={`stat-container ${getStatusColor(energy)}`} onMouseEnter={(e) => handleStatHover("energy", e)} onMouseLeave={() => setHoveredStat(null)}>
            <div className="stat-icon energy-icon" />
            <div className="stat-bar-container">
              <div className="stat-label">
                <span>Energy</span>
                <span className="stat-value">
                  <Indicator statKey="energy" />
                  {Math.round(energy)}%
                </span>
              </div>
              <div className="stat-bar">
                <div className="stat-bar-fill" style={{ width: `${energy}%` }} />
              </div>
            </div>
          </div>

          {/* Hunger */}
          <div className={`stat-container ${getStatusColor(meal)}`} onMouseEnter={(e) => handleStatHover("meal", e)} onMouseLeave={() => setHoveredStat(null)}>
            <div className="stat-icon meal-icon" />
            <div className="stat-bar-container">
              <div className="stat-label">
                <span>Hunger</span>
                <span className="stat-value">
                  <Indicator statKey="meal" /> {Math.round(meal)}%
                </span>
              </div>
              <div className="stat-bar">
                <div className="stat-bar-fill" style={{ width: `${meal}%` }} />
              </div>
            </div>
          </div>

          {/* Sleep */}
          <div className={`stat-container ${getStatusColor(sleep)}`} onMouseEnter={(e) => handleStatHover("sleep", e)} onMouseLeave={() => setHoveredStat(null)}>
            <div className="stat-icon sleep-icon" />
            <div className="stat-bar-container">
              <div className="stat-label">
                <span>Sleep</span>
                <span className="stat-value">
                  <Indicator statKey="sleep" />
                  {Math.round(sleep)}%
                </span>
              </div>
              <div className="stat-bar">
                <div className="stat-bar-fill" style={{ width: `${sleep}%` }} />
              </div>
            </div>
          </div>

          {/* Mood */}
          <div className={`stat-container mood ${getStatusColor(happiness)}`} onMouseEnter={(e) => handleStatHover("happiness", e)} onMouseLeave={() => setHoveredStat(null)}>
            <div className={`stat-icon mood-icon mood-${getStatusColor(happiness)}`} />
            <div className="stat-bar-container">
              <div className="stat-label">
                <span>Mood</span>
                <span className="stat-value">
                  <Indicator statKey="happiness" />
                  {Math.round(happiness)}%
                </span>
              </div>
              <div className="stat-bar">
                <div className="stat-bar-fill mood-bar" style={{ width: `${happiness}%` }} />
              </div>
            </div>
          </div>

          {/* Cleanliness */}
          <div className={`stat-container ${getStatusColor(cleanliness)}`} onMouseEnter={(e) => handleStatHover("cleanliness", e)} onMouseLeave={() => setHoveredStat(null)}>
            <div className="stat-icon clean-icon" />
            <div className="stat-bar-container">
              <div className="stat-label">
                <span>Clean</span>
                <span className="stat-value">
                  <Indicator statKey="cleanliness" />
                  {Math.round(cleanliness)}%
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
            <div className="resource-item" onMouseEnter={(e) => handleStatHover("money", e)} onMouseLeave={() => setHoveredStat(null)}>
              <div className="resource-icon money-icon" />
              <span className="resource-value">
                <Indicator statKey="money" />${money}
              </span>
            </div>

            <div className={`resource-item ${xpGainAnimation ? "xp-gain-glow" : ""}`} onMouseEnter={(e) => handleStatHover("experience", e)} onMouseLeave={() => setHoveredStat(null)}>
              <div className={`resource-icon xp-icon ${xpGainAnimation ? "xp-icon-spin" : ""}`} />
              <span className="resource-value">
                <Indicator statKey="experience" />
                {`${experience} XP`}
              </span>
            </div>

            <div className="resource-item" onMouseEnter={(e) => handleStatHover("skillPoints", e)} onMouseLeave={() => setHoveredStat(null)}>
              <div className="resource-icon skill-icon" />
              <span className="resource-value">
                <Indicator statKey="skillPoints" />
                {`${skillPoints} SP`}
              </span>
            </div>
          </div>
          <button onClick={handleInventoryClick} className={`inventory-button stats-inventory-button`}>
            <div className="inventory-icon" />
            <span>ITEMS</span>
          </button>
        </div>
      </div>

      {hoveredStat && STAT_DESCRIPTIONS[hoveredStat] && (
        <div
          className="stat-tooltip"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            display: "block",
          }}
        >
          <h4>{STAT_DESCRIPTIONS[hoveredStat].title}</h4>
          <p>{STAT_DESCRIPTIONS[hoveredStat].description}</p>
        </div>
      )}

      {/* Level Up Notification */}
      {levelUpAnimation && (
        <div className="level-up-notification">
          <div className="level-up-text">LEVEL UP!</div>
          <div className="level-up-details">You reached Level {level}!</div>
        </div>
      )}

      {showInventory && <Inventory items={items} onClose={handleCloseInventory} onUseItem={onUseItem} /* ← add */ />}
    </>
  );
}

export default StatsPlayer;
