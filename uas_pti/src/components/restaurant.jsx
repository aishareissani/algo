import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";
import { useSpeedMode, SpeedToggleButton } from "./speed";
import Inventory from "./inventory";
import "../restaurant.css";
import ArrowKey from "./wasd_key";

function Resto() {
  const { isFastForward } = useSpeedMode();
  const location = useLocation();
  const navigate = useNavigate();

  const { characterName = "claire", playerName = "Player", stats: initialStats = {} } = location.state || {};
  const [showDialog, setShowDialog] = useState(false);
  const [currentLocationResto, setcurrentLocationResto] = useState(null);
  const [isPerformingActivity, setIsPerformingActivity] = useState(false);
  const [activityProgress, setActivityProgress] = useState(0);
  const [currentActivity, setCurrentActivity] = useState("");
  const [showInventory, setShowInventory] = useState(false);

  const [playerPos, setPlayerPos] = useState({ x: 2000, y: 1300 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(0.299);
  const [actualViewportSize, setActualViewportSize] = useState({
    width: 0,
    height: 0,
  });

  const restoRef = useRef(null);
  const playerRef = useRef(null);
  const activityIntervalRef = useRef(null);

  const WORLD_WIDTH = 3825;
  const WORLD_HEIGHT = 2008;
  const PLAYER_SIZE = 190;
  const PLAYER_SCALE = 1.5;
  const MOVE_SPEED = 25;
  const ACTIVITY_DURATION = 10000;
  const ACTIVITY_UPDATE_INTERVAL = 1000;

  const defaultStats = {
    meal: 50,
    sleep: 50,
    energy: 80,
    happiness: 50,
    cleanliness: 50,
    health: 80,
    money: 100,
    experience: 0,
    level: 1,
    skillPoints: 0,
    items: [], // Make sure this is included
  };

  // Initialize with stats from map or default values
  // Using proper type checking to avoid NaN values
  const [playerStats, setPlayerStats] = useState(() => {
    // Handle potentially corrupt stats data
    const stats = { ...defaultStats };

    if (initialStats) {
      // Ensure all numeric values are actually numbers
      Object.keys(stats).forEach((key) => {
        if (key !== "items") {
          // Make sure the value exists and is a valid number
          if (initialStats[key] !== undefined && !isNaN(Number(initialStats[key]))) {
            stats[key] = Number(initialStats[key]);
          }
        }
      });

      // Handle items array separately
      if (Array.isArray(initialStats.items)) {
        stats.items = [...initialStats.items];
      }
    }

    return stats;
  });

  const handleBackToMap = () => {
    navigate("/map", {
      state: {
        characterName,
        playerName,
        stats: playerStats, // Pass current stats back to map
      },
    });
  };

  const addItemToInventory = (itemName, category, icon, onStatsUpdate) => {
    onStatsUpdate((prev) => {
      const existingItemIndex = prev.items.findIndex((item) => item.name === itemName);
      const updatedItems = [...prev.items];
      const newExperience = prev.experience + 1;

      if (existingItemIndex !== -1) {
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1,
        };
      } else {
        const newItem = {
          id: Date.now(),
          name: itemName,
          category: category,
          icon: icon,
          quantity: 1,
        };
        updatedItems.push(newItem);
      }

      return {
        ...prev,
        items: updatedItems,
        experience: newExperience,
      };
    });
  };

  const performActivity = (activityName, statChanges, collectItem = null) => {
    if (isPerformingActivity) return;

    setIsPerformingActivity(true);
    setCurrentActivity(activityName);
    setActivityProgress(0);
    setShowDialog(false);

    if (isFastForward) {
      // Fast Forward mode: apply all changes instantly
      setPlayerStats((prev) => {
        const newStats = { ...prev };
        Object.keys(statChanges).forEach((stat) => {
          const change = Number(statChanges[stat]);
          if (isNaN(change)) return;

          if (stat === "money" || stat === "experience" || stat === "skillPoints") {
            const prevValue = Number(prev[stat]) || 0;
            newStats[stat] = Math.max(0, prevValue + change);
          } else {
            const prevValue = Number(prev[stat]) || 0;
            newStats[stat] = Math.min(100, Math.max(0, prevValue + change));
          }
        });
        return newStats;
      });

      // Add item to inventory if applicable
      if (collectItem) {
        addItemToInventory(collectItem.name, collectItem.category, collectItem.icon, setPlayerStats);
      }

      // Show a brief flash of activity
      setTimeout(() => {
        setActivityProgress(100);
        setTimeout(() => {
          setIsPerformingActivity(false);
          setCurrentActivity("");
          setActivityProgress(0);
        }, 500);
      }, 300);
    } else {
      const totalSteps = ACTIVITY_DURATION / ACTIVITY_UPDATE_INTERVAL;
      let currentStep = 0;

      const incrementalChanges = {};
      Object.keys(statChanges).forEach((stat) => {
        const change = Number(statChanges[stat]);
        if (isNaN(change)) return;
        incrementalChanges[stat] = change / totalSteps;
      });

      activityIntervalRef.current = setInterval(() => {
        currentStep++;
        const progress = (currentStep / totalSteps) * 100;
        setActivityProgress(progress);

        setPlayerStats((prev) => {
          const newStats = { ...prev };
          Object.keys(incrementalChanges).forEach((stat) => {
            const increment = Number(incrementalChanges[stat]);
            if (isNaN(increment)) return;

            if (stat === "money" || stat === "experience" || stat === "skillPoints") {
              const prevValue = Number(prev[stat]) || 0;
              newStats[stat] = Math.max(0, prevValue + increment);
            } else {
              const prevValue = Number(prev[stat]) || 0;
              newStats[stat] = Math.min(100, Math.max(0, prevValue + increment));
            }
          });
          return newStats;
        });

        if (currentStep >= totalSteps) {
          // Add item to inventory when activity completes
          if (collectItem) {
            addItemToInventory(collectItem.name, collectItem.category, collectItem.icon, setPlayerStats);
          }
          clearInterval(activityIntervalRef.current);
          setIsPerformingActivity(false);
          setActivityProgress(0);
          setCurrentActivity("");
        }
      }, ACTIVITY_UPDATE_INTERVAL);
    }
  };

  const handleEnterLocation = () => {
    console.log(`Performing activity at ${currentLocationResto}`);

    if (currentLocationResto === "Takeaway") {
      performActivity(
        "Ordering Takeaway",
        {
          happiness: 20,
          money: -20,
        },
        {
          name: "Takeaway Meal",
          category: "Daily",
          icon: "takeaway",
        }
      );
    } else if (currentLocationResto === "Eat") {
      performActivity("Dining In", {
        happiness: 30,
        energy: 25,
        meal: 40,
        money: -20,
      });
    } else if (currentLocationResto === "Drink") {
      performActivity("Having a Drink", {
        happiness: 15,
        energy: 25,
        meal: 10,
        money: -5,
      });
    }
  };

  const isNearCashier = (x, y) => {
    return x >= 2575 && x <= 2725 && y >= 142 && y <= 550;
  };

  const isNearTable = (x, y) => {
    return (
      (x >= 1750 && x <= 2050 && y >= 750 && y <= 1025) || // Spot 1
      (x >= 1750 && x <= 2050 && y >= 1375 && y <= 1725) || // Spot 2
      (x >= 525 && x <= 825 && y >= 1375 && y <= 1725) || // Spot 3
      (x >= 525 && x <= 825 && y >= 750 && y <= 1025) // Spot 4
    );
  };

  const isNearChair = (x, y) => {
    return x >= 2700 && x <= 3682 && y >= 975 && y <= 1200;
  };

  const dialogMessages = {
    Takeaway: "Would you like to order some takeaway?",
    Eat: "Would you like to eat here at the restaurant?",
    Drink: "Would you like to sit down and enjoy a drink?",
  };

  const renderDialogMessage = (message) => {
    return message.split("\n").map((line, idx) => <p key={idx}>{line}</p>);
  };

  // Replace the handleUseItem function in Resto.js with this:
  const handleUseItem = (item) => {
    if (item.name !== "Takeaway Meal") return;

    setPlayerStats((prev) => {
      /* cari item */
      const idx = prev.items.findIndex((it) => it.name === item.name);
      if (idx === -1) return prev;

      /* kurangi qty */
      const items = [...prev.items];
      items[idx] = { ...items[idx], quantity: items[idx].quantity - 1 };
      const cleaned = items.filter((it) => it.quantity > 0);

      /* update stats (clamp 0-100) */
      const energy = Math.min(100, prev.energy + 25);
      const meal = Math.min(100, prev.meal + 40);

      return { ...prev, energy, meal, items: cleaned };
    });
  };

  useEffect(() => {
    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
    };
  }, []);

  // Get actual viewport size
  useEffect(() => {
    const updateViewportSize = () => {
      if (restoRef.current) {
        setActualViewportSize({
          width: restoRef.current.clientWidth,
          height: restoRef.current.clientHeight,
        });
      }
    };

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  // Handle camera movement
  useEffect(() => {
    if (actualViewportSize.width === 0 || actualViewportSize.height === 0 || zoomLevel === 0) return;

    const scaledWorldWidth = WORLD_WIDTH * zoomLevel;
    const scaledWorldHeight = WORLD_HEIGHT * zoomLevel;

    const viewportWidthInWorld = actualViewportSize.width / zoomLevel;
    const viewportHeightInWorld = actualViewportSize.height / zoomLevel;

    let targetCameraX = playerPos.x - viewportWidthInWorld / 2;
    let targetCameraY = playerPos.y - viewportHeightInWorld / 2;

    if (scaledWorldWidth < actualViewportSize.width) {
      targetCameraX = (WORLD_WIDTH - viewportWidthInWorld) / 2;
    } else {
      targetCameraX = Math.max(0, Math.min(WORLD_WIDTH - viewportWidthInWorld, targetCameraX));
    }

    if (scaledWorldHeight < actualViewportSize.height) {
      targetCameraY = (WORLD_HEIGHT - viewportHeightInWorld) / 2;
    } else {
      targetCameraY = Math.max(0, Math.min(WORLD_HEIGHT - viewportHeightInWorld, targetCameraY));
    }

    setCameraPos({ x: targetCameraX, y: targetCameraY });
  }, [playerPos, zoomLevel, actualViewportSize, WORLD_WIDTH, WORLD_HEIGHT]);

  const handleArrowPress = (direction) => {
    setPlayerPos((prev) => {
      let newX = prev.x;
      let newY = prev.y;

      switch (direction) {
        case "up":
          newY = Math.max(0, prev.y - MOVE_SPEED);
          break;
        case "down":
          newY = Math.min(WORLD_HEIGHT - PLAYER_SIZE, prev.y + MOVE_SPEED);
          break;
        case "left":
          newX = Math.max(0, prev.x - MOVE_SPEED);
          break;
        case "right":
          newX = Math.min(WORLD_WIDTH - PLAYER_SIZE, prev.x + MOVE_SPEED);
          break;
        default:
          break;
      }

      return { x: newX, y: newY };
    });
  };

  useEffect(() => {
    if (isPerformingActivity) return; // Don't show dialogs during activities

    if (isNearCashier(playerPos.x, playerPos.y)) {
      setcurrentLocationResto("Takeaway");
      setShowDialog(true);
    } else if (isNearTable(playerPos.x, playerPos.y)) {
      setcurrentLocationResto("Eat");
      setShowDialog(true);
    } else if (isNearChair(playerPos.x, playerPos.y)) {
      setcurrentLocationResto("Drink");
      setShowDialog(true);
    } else {
      setcurrentLocationResto(null);
      setShowDialog(false);
    }
  }, [playerPos, isPerformingActivity]);

  return (
    <div className="resto-game-container">
      <div>
        <StatsPlayer stats={playerStats} onStatsUpdate={setPlayerStats} onUseItem={handleUseItem} /* ← add */ />
        <SpeedToggleButton />
      </div>
      <div className="resto-game-viewport" ref={restoRef}>
        <SpeedToggleButton />
        {showDialog && currentLocationResto && !isPerformingActivity && (
          <div className="dialog fade-in-center">
            {renderDialogMessage(dialogMessages[currentLocationResto] || `Do you want to enter the ${currentLocationResto}?`)}
            <button className="yes-btn" onClick={handleEnterLocation}>
              Yes
            </button>
            <button className="no-btn" onClick={() => setShowDialog(false)}>
              No
            </button>
          </div>
        )}
        {isPerformingActivity && (
          <div className="activity-overlay">
            <div className="activity-info">
              <h3>{currentActivity}...</h3>
              <div className="activity-progress-bar">
                <div className="activity-progress-fill" style={{ width: `${activityProgress}%` }} />
              </div>
              <p>{Math.round(activityProgress)}%</p>
            </div>
          </div>
        )}
        <div
          className="resto-game-world resto-background"
          style={{
            width: `${WORLD_WIDTH}px`,
            height: `${WORLD_HEIGHT}px`,
            transform: `translate(-${cameraPos.x * zoomLevel}px, -${cameraPos.y * zoomLevel}px) scale(${zoomLevel})`,
            transformOrigin: "0 0",
          }}
        >
          <div
            className="resto-player"
            ref={playerRef}
            style={{
              left: `${playerPos.x}px`,
              top: `${playerPos.y}px`,
              width: `${PLAYER_SIZE}px`,
              height: `${PLAYER_SIZE}px`,
              transform: `translate(-50%, -50%) scale(${PLAYER_SCALE})`,
              position: "absolute",
            }}
          >
            <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="resto-player-sprite" draggable={false} style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
      </div>

      <div className="game-hud">
        <div className="player-info">
          <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="hud-avatar" />
          <div className="player-coords">
            {playerName.toUpperCase()} • X: {Math.floor(playerPos.x)} Y: {Math.floor(playerPos.y)}
            {/* Back to Map Button positioned directly below coordinates */}
            <button className="back-to-map-button-inline" onClick={handleBackToMap}>
              Back to Map
            </button>
          </div>
        </div>
        <div className="controls-hint">
          <div>🎮 Arrow Keys / WASD to move</div>
          <div>🗺️ Explore the restaurant!</div>
        </div>
      </div>

      {showInventory && <Inventory items={playerStats.items} onClose={() => setShowInventory(false)} onUseItem={handleUseItem} />}

      <ArrowKey onKeyPress={handleArrowPress} />
    </div>
  );
}

export default Resto;
