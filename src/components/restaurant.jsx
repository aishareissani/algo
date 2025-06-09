import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";
import { useSpeedMode, SpeedToggleButton } from "./speed";
import BackTo from "./BackTo"; // ADD THIS IMPORT (lowercase)
import Inventory from "./inventory";
import "../restaurant.css";
import ArrowKey from "./wasd_key";
import Task from "./task";

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
  const [showTasks, setShowTasks] = useState(true);

  const [mobileZoom, setMobileZoom] = useState(0.299);

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
    items: [],
    tasks: {},
  };

  const [playerStats, setPlayerStats] = useState(() => {
    const stats = { ...defaultStats };

    if (initialStats) {
      Object.keys(stats).forEach((key) => {
        if (key === "items") {
          if (Array.isArray(initialStats.items)) {
            stats.items = [...initialStats.items];
          }
        } else if (key === "tasks") {
          if (initialStats.tasks && typeof initialStats.tasks === "object") {
            stats.tasks = { ...initialStats.tasks };
          }
        } else {
          if (initialStats[key] !== undefined && !isNaN(Number(initialStats[key]))) {
            stats[key] = Number(initialStats[key]);
          }
        }
      });
    }

    return stats;
  });

  // Initialize tasks
  useEffect(() => {
    const taskLocations = {
      restaurant: [
        { id: "takeaway", name: "Order Takeaway", priority: "daily" },
        { id: "eat", name: "Eat Delicious Meal", priority: "daily" },
        { id: "drink", name: "Drink Some Juice", priority: "daily" },
      ],
    };

    setPlayerStats((prev) => {
      const updatedTasks = { ...prev.tasks };
      let needsUpdate = false;

      Object.keys(taskLocations).forEach((location) => {
        taskLocations[location].forEach((task) => {
          const taskKey = `${location}-${task.id}`;
          if (!updatedTasks[taskKey]) {
            updatedTasks[taskKey] = { ...task, completed: false };
            needsUpdate = true;
          }
        });
      });

      if (needsUpdate) {
        return {
          ...prev,
          tasks: updatedTasks,
        };
      }
      return prev;
    });
  }, []);

  const handlebackToMap = () => {
    navigate("/map", {
      state: {
        characterName,
        playerName,
        stats: playerStats,
      },
    });
  };

  // Function to mark a task as completed
  const completeTask = (taskId) => {
    const taskKey = `restaurant-${taskId}`;
    setPlayerStats((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskKey]: {
          ...prev.tasks[taskKey],
          completed: true,
        },
      },
    }));
  };

  // Function to toggle task completion (for manual toggling via UI)
  const toggleTaskCompletion = (taskId) => {
    const taskKey = `restaurant-${taskId}`;
    setPlayerStats((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskKey]: {
          ...prev.tasks[taskKey],
          completed: !prev.tasks[taskKey]?.completed,
        },
      },
    }));
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

    // Mark corresponding task as completed
    if (currentLocationResto === "Takeaway") {
      completeTask("takeaway");
    } else if (currentLocationResto === "Eat") {
      completeTask("eat");
    } else if (currentLocationResto === "Drink") {
      completeTask("drink");
    }

    if (isFastForward) {
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

      if (collectItem) {
        addItemToInventory(collectItem.name, collectItem.category, collectItem.icon, setPlayerStats);
      }

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
          experience: 1,
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
        experience: 1,
      });
    } else if (currentLocationResto === "Drink") {
      performActivity("Having a Drink", {
        happiness: 15,
        energy: 25,
        meal: 10,
        money: -5,
        experience: 1,
      });
    }
  };

  const isNearCashier = (x, y) => {
    return x >= 2575 && x <= 2725 && y >= 142 && y <= 550;
  };

  const isNearTable = (x, y) => {
    return (x >= 1750 && x <= 2050 && y >= 750 && y <= 1025) || (x >= 1750 && x <= 2050 && y >= 1375 && y <= 1725) || (x >= 525 && x <= 825 && y >= 1375 && y <= 1725) || (x >= 525 && x <= 825 && y >= 750 && y <= 1025);
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

  const handleUseItem = (item) => {
    if (item.name !== "Takeaway Meal") return;

    setPlayerStats((prev) => {
      const idx = prev.items.findIndex((it) => it.name === item.name);
      if (idx === -1) return prev;

      const items = [...prev.items];
      items[idx] = { ...items[idx], quantity: items[idx].quantity - 1 };
      const cleaned = items.filter((it) => it.quantity > 0);

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

  const handleArrowPress = useCallback((direction) => {
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
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isPerformingActivity) return;

      let direction = null;
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          direction = "up";
          break;
        case "ArrowDown":
        case "s":
        case "S":
          direction = "down";
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          direction = "left";
          break;
        case "ArrowRight":
        case "d":
        case "D":
          direction = "right";
          break;
        default:
          break;
      }

      if (direction) {
        e.preventDefault();
        handleArrowPress(direction);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPerformingActivity, handleArrowPress]);

  useEffect(() => {
    if (isPerformingActivity) return;

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

  // NEW: Calculate optimal zoom for mobile to eliminate empty space
  useEffect(() => {
    const calculateMobileZoom = () => {
      if (actualViewportSize.width === 0 || actualViewportSize.height === 0) return;

      // Check if we're on mobile (you can adjust this breakpoint)
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        // Calculate zoom to fill the viewport optimally
        const widthZoom = actualViewportSize.width / WORLD_WIDTH;
        const heightZoom = actualViewportSize.height / WORLD_HEIGHT;

        // Use the larger zoom value to ensure no empty space
        const optimalZoom = Math.max(widthZoom, heightZoom);

        // Set minimum and maximum zoom limits for better gameplay
        const minZoom = 0.15;
        const maxZoom = 0.8;
        const finalZoom = Math.max(minZoom, Math.min(maxZoom, optimalZoom));

        console.log(`Mobile zoom calculated: ${finalZoom} (width: ${widthZoom}, height: ${heightZoom})`);

        setMobileZoom(finalZoom);
        setZoomLevel(finalZoom);
      } else {
        // Desktop zoom - use original value
        setZoomLevel(0.299);
      }
    };

    calculateMobileZoom();

    // Recalculate on window resize
    window.addEventListener("resize", calculateMobileZoom);
    return () => window.removeEventListener("resize", calculateMobileZoom);
  }, [actualViewportSize, WORLD_WIDTH, WORLD_HEIGHT]);

  // Camera position calculation - updated to work with mobile zoom
  useEffect(() => {
    if (actualViewportSize.width === 0 || actualViewportSize.height === 0 || zoomLevel === 0) return;

    const viewportWidthInWorld = actualViewportSize.width / zoomLevel;
    const viewportHeightInWorld = actualViewportSize.height / zoomLevel;

    let targetCameraX = playerPos.x - viewportWidthInWorld / 2;
    let targetCameraY = playerPos.y - viewportHeightInWorld / 2;

    // Constrain camera to world boundaries
    targetCameraX = Math.max(0, Math.min(WORLD_WIDTH - viewportWidthInWorld, targetCameraX));
    targetCameraY = Math.max(0, Math.min(WORLD_HEIGHT - viewportHeightInWorld, targetCameraY));

    setCameraPos({ x: targetCameraX, y: targetCameraY });
  }, [playerPos, zoomLevel, actualViewportSize, WORLD_WIDTH, WORLD_HEIGHT]);

  return (
    <div className="resto-game-container">
      <div>
        <StatsPlayer stats={playerStats} onStatsUpdate={setPlayerStats} onUseItem={handleUseItem} />
        <SpeedToggleButton />
        <BackTo type="map" onClick={handlebackToMap} /> {/* UPDATED: Using BackTo component */}
      </div>
      <div className="resto-game-viewport" ref={restoRef}>
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
            {/* REMOVED OLD BUTTON */}
          </div>
        </div>
        <div className="controls-hint">
          <div>🎮 Arrow Keys / WASD to move</div>
          <div>🗺️ Explore the restaurant!</div>
        </div>
      </div>

      {showInventory && <Inventory items={playerStats.items} onClose={() => setShowInventory(false)} onUseItem={handleUseItem} />}

      <ArrowKey onKeyPress={handleArrowPress} />

      <Task currentLocation="restaurant" isInsideLocation={true} customPosition={{ top: "65px" }} externalTasks={playerStats.tasks} onTaskComplete={toggleTaskCompletion} />
    </div>
  );
}

export default Resto;
