import React, { useState, useEffect, useRef } from "react";
import "../stats.css";
import { useSpeedMode } from "./speed";
import Inventory from "./inventory";
import GameOver from "./game_over";

function StatsPlayer({ stats = {}, onStatsUpdate, onResetStats, onUseItem, visitedLocations = new Set(["home"]), usedItems = new Set(), playtime = 0, onMainMenu, isInsideLocation = false }) {
  // Destructure stats object
  const { meal = 50, sleep = 50, health = 80, energy = 80, happiness = 50, cleanliness = 50, money = 100, experience = 0, level = 1, skillPoints = 0, items = [] } = stats;

  const [showInventory, setShowInventory] = useState(false);
  const [increasedIndicators, setIncreasedIndicators] = useState({});
  const [decreasedIndicators, setDecreasedIndicators] = useState({});
  const [levelUpAnimation, setLevelUpAnimation] = useState(false);
  const [xpGainAnimation, setXpGainAnimation] = useState(false);
  const [showLevelUpNotification, setShowLevelUpNotification] = useState(false);
  const [levelUpData, setLevelUpData] = useState({ newLevel: 1, oldLevel: 1 });
  const prevStatsRef = useRef();
  const { isFastForward } = useSpeedMode();

  const [hoveredStat, setHoveredStat] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const statRefs = useRef({});

  const [showGameOver, setShowGameOver] = useState(false);

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
    level: {
      title: "Level",
      description: "Your character level. Increases every 5 XP or SP gained.",
    },
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
      description: "Currency for buying items. Earn by working",
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

  // Check for Game Over condition
  useEffect(() => {
    if (health <= 0 && !showGameOver) {
      setShowGameOver(true);
    }
  }, [health, showGameOver]);

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

      // Level up calculation and notification
      const baseLevel = 1;
      const xpLevels = Math.floor(stats.experience / 5);
      const spLevels = Math.floor(stats.skillPoints / 5);
      const calculatedLevel = baseLevel + xpLevels + spLevels;

      if (calculatedLevel > stats.level) {
        // Show level up notification
        setLevelUpData({ newLevel: calculatedLevel, oldLevel: stats.level });
        setShowLevelUpNotification(true);
        setLevelUpAnimation(true);

        // Hide notification after 4 seconds
        setTimeout(() => {
          setShowLevelUpNotification(false);
        }, 4000);

        // Hide level badge animation after 1 second
        setTimeout(() => {
          setLevelUpAnimation(false);
        }, 1000);

        // Update level
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
    // Don't run degradation if game is over
    if (showGameOver) return;

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
  }, [stats, onStatsUpdate, isFastForward, showGameOver]);

  const handleInventoryClick = () => {
    setShowInventory(true);
  };

  const handleCloseInventory = () => {
    setShowInventory(false);
  };

  const handleStatHover = (statKey, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 10,
    });
    setHoveredStat(statKey);
  };

  // Check if current screen size should use circular behavior
  const shouldUseCircularBehavior = () => {
    return window.innerWidth <= 1024;
  };

  return (
    <>
      {/* Level Up Notification */}
      {showLevelUpNotification && (
        <div className="level-up-notification">
          <div className="level-up-text">LEVEL UP!</div>
          <div className="level-up-details">Level {levelUpData.newLevel}</div>
        </div>
      )}

      {/* Game Over Screen - Should be at the very top level */}
      {showGameOver && (
        <GameOver
          playerStats={stats}
          tasks={stats.tasks || {}}
          visitedLocations={visitedLocations}
          usedItems={usedItems}
          playtime={playtime}
          onNewGame={() => {
            // Reset all stats and close game over
            if (onResetStats) {
              onResetStats();
            }
            setShowGameOver(false);
          }}
          onMainMenu={() => {
            // Handle return to main menu
            if (onMainMenu) {
              onMainMenu();
            }
            setShowGameOver(false);
          }}
        />
      )}

      {/* Mobile/Tablet Top Stats Panel */}
      <div className="stats-top-mobile-tablet mobile-tablet-only">
        <div className="stats-top-grid">
          {/* Row 1 */}
          {/* Health - progress bar */}
          <div className="stats-bar-tile health">
            <div className="tile-label">Health</div>
            <div className="tile-bar-row">
              <div className="progress-bar-sm">
                <div className="progress-bar-fill" style={{ width: `${health}%` }}></div>
              </div>
              <span className="tile-value">
                {Math.round(health)}%
                <Indicator statKey="health" />
              </span>
            </div>
          </div>

          {/* Energy - progress bar */}
          <div className="stats-bar-tile energy">
            <div className="tile-label">Energy</div>
            <div className="tile-bar-row">
              <div className="progress-bar-sm">
                <div className="progress-bar-fill" style={{ width: `${energy}%` }}></div>
              </div>
              <span className="tile-value">
                {Math.round(energy)}%
                <Indicator statKey="energy" />
              </span>
            </div>
          </div>

          {/* Hunger - progress bar */}
          <div className="stats-bar-tile hunger">
            <div className="tile-label">Hunger</div>
            <div className="tile-bar-row">
              <div className="progress-bar-sm">
                <div className="progress-bar-fill" style={{ width: `${meal}%` }}></div>
              </div>
              <span className="tile-value">
                {Math.round(meal)}%
                <Indicator statKey="meal" />
              </span>
            </div>
          </div>

          {/* Row 2 */}
          {/* Money - info tile */}
          <div className="stats-tile info money">
            <div className="tile-label">Money</div>
            <div className="tile-value">
              ${money}
              <Indicator statKey="money" />
            </div>
          </div>

          {/* XP - info tile */}
          <div className="stats-tile info xp">
            <div className="tile-label">XP</div>
            <div className="tile-value">
              {experience.toFixed(1)}
              <Indicator statKey="experience" />
            </div>
          </div>

          {/* SP - info tile */}
          <div className="stats-tile info sp">
            <div className="tile-label">SP</div>
            <div className="tile-value">
              {skillPoints.toFixed(1)}
              <Indicator statKey="skillPoints" />
            </div>
          </div>

          {/* Sleep - progress bar */}
          <div className="stats-bar-tile sleep">
            <div className="tile-label">Sleep</div>
            <div className="tile-bar-row">
              <div className="progress-bar-sm">
                <div className="progress-bar-fill" style={{ width: `${sleep}%` }}></div>
              </div>
              <span className="tile-value">
                {Math.round(sleep)}%
                <Indicator statKey="sleep" />
              </span>
            </div>
          </div>

          {/* Mood - progress bar */}
          <div className="stats-bar-tile mood">
            <div className="tile-label">Mood</div>
            <div className="tile-bar-row">
              <div className="progress-bar-sm">
                <div className="progress-bar-fill" style={{ width: `${happiness}%` }}></div>
              </div>
              <span className="tile-value">
                {Math.round(happiness)}%
                <Indicator statKey="happiness" />
              </span>
            </div>
          </div>

          {/* Clean - progress bar */}
          <div className="stats-bar-tile clean">
            <div className="tile-label">Clean</div>
            <div className="tile-bar-row">
              <div className="progress-bar-sm">
                <div className="progress-bar-fill" style={{ width: `${cleanliness}%` }}></div>
              </div>
              <span className="tile-value">
                {Math.round(cleanliness)}%
                <Indicator statKey="cleanliness" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {shouldUseCircularBehavior() && (
        <div className={`inventory-button-circular-container ${isInsideLocation ? "inside-location" : ""}`}>
          <button onClick={handleInventoryClick} className="inventory-button-circular">
            <div className="inventory-icon-circular"></div>
          </button>
        </div>
      )}

      {/* Desktop Version - Original Design */}
      <div className="stats-card desktop-only" role="region" aria-label="Player status">
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
                {`${+experience.toFixed(1)} XP`}
              </span>
            </div>

            <div className="resource-item" onMouseEnter={(e) => handleStatHover("skillPoints", e)} onMouseLeave={() => setHoveredStat(null)}>
              <div className="resource-icon skill-icon" />
              <span className="resource-value">
                <Indicator statKey="skillPoints" />
                {`${+skillPoints.toFixed(1)} SP`}
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

      {showInventory && <Inventory items={items} onClose={handleCloseInventory} onUseItem={onUseItem} />}
    </>
  );
}

export default StatsPlayer;
