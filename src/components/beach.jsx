import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";
import { useSpeedMode, SpeedToggleButton } from "./speed";
import BackTo from "./BackTo"; // ADD THIS IMPORT
import "../beach.css";
import ArrowKey from "./wasd_key";
import Task from "./task";

function Beach() {
  const { isFastForward } = useSpeedMode();
  const location = useLocation();
  const navigate = useNavigate();

  const { characterName = "manda", playerName = "Player", stats: initialStats = {} } = location.state || {};
  const [showDialog, setShowDialog] = useState(false);
  const [currentLocationbeach, setCurrentLocationbeach] = useState(null);
  const [isPerformingActivity, setIsPerformingActivity] = useState(false);
  const [activityProgress, setActivityProgress] = useState(0);
  const [currentActivity, setCurrentActivity] = useState("");
  const [showTasks, setShowTasks] = useState(true);

  const [mobileZoom, setMobileZoom] = useState(0.299);

  const [playerPos, setPlayerPos] = useState({ x: 2000, y: 1300 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(0.299);
  const [actualViewportSize, setActualViewportSize] = useState({
    width: 0,
    height: 0,
  });

  const beachRef = useRef(null);
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
      beach: [
        { id: "swim", name: "Swim Around", priority: "daily" },
        { id: "sunbath", name: "Enjoy Sunbath", priority: "daily" },
        { id: "sandcastle", name: "Make Sandcastle", priority: "bonus" },
        { id: "seashell", name: "Collect Seashells", priority: "bonus" },
        { id: "flower", name: "Collect Flowers", priority: "bonus" },
        { id: "starfish", name: "Find Starfish", priority: "bonus" },
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

  const handleBackToMap = () => {
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
    const taskKey = `beach-${taskId}`;
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
    const taskKey = `beach-${taskId}`;
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

      // Add XP for collecting an item (1 item = 1 XP)
      const newExperience = prev.experience + 1;

      if (existingItemIndex !== -1) {
        // Item already exists, increase quantity
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1,
        };
      } else {
        // New item, add to inventory
        const newItem = {
          id: Date.now(), // Simple ID generation
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
        experience: newExperience, // Update experience
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
    if (currentLocationbeach === "Swim") {
      completeTask("swim");
    } else if (currentLocationbeach === "Sunbath") {
      completeTask("sunbath");
    } else if (currentLocationbeach === "Sandcastle") {
      completeTask("sandcastle");
    } else if (currentLocationbeach === "Seashell") {
      completeTask("seashell");
    } else if (currentLocationbeach === "Flower") {
      completeTask("flower");
    } else if (currentLocationbeach === "StarFish") {
      completeTask("starfish");
    }

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
    console.log(`Performing activity at ${currentLocationbeach}`);

    if (currentLocationbeach === "Swim") {
      performActivity("Swimming", {
        energy: -25,
        happiness: 40,
        health: 10,
        meal: -20,
        experience: 1,
      });
    } else if (currentLocationbeach === "Sunbath") {
      performActivity("Taking a Sunbath", {
        happiness: 30,
        energy: 10,
        experience: 1,
      });
    } else if (currentLocationbeach === "Sandcastle") {
      performActivity("Making a sand castle", {
        happiness: 50,
        energy: 20,
        meal: -5,
        cleanliness: -10,
        skillPoints: 1,
      });
    } else if (currentLocationbeach === "Seashell") {
      performActivity(
        "Picking seashell",
        {
          happiness: 40,
          energy: -20,
          meal: -20,
          skillPoints: 1,
        },
        {
          name: "Conch Shell",
          category: "Marine",
          icon: "conch-shell",
        }
      );
    } else if (currentLocationbeach === "Flower") {
      // You can vary the flower type randomly if you want
      const flowers = [
        { name: "Rose", icon: "rose" },
        { name: "Daisy", icon: "daisy" },
        { name: "Sunflower", icon: "sunflower" },
        { name: "Tulip", icon: "tulip" },
      ];
      const randomFlower = flowers[Math.floor(Math.random() * flowers.length)];

      performActivity(
        "Picking flower",
        {
          happiness: 40,
          energy: -20,
          meal: -20,
          skillPoints: 1,
        },
        {
          name: randomFlower.name,
          category: "Flowers",
          icon: randomFlower.icon,
        }
      );
    } else if (currentLocationbeach === "StarFish") {
      performActivity(
        "Picking star fish",
        {
          happiness: 40,
          energy: -20,
          meal: -20,
          skillPoints: 1,
        },
        {
          name: "Starfish",
          category: "Marine",
          icon: "starfish",
        }
      );
    }
  };

  const isNearSwim = (x, y) => {
    return x >= 2275 && x <= 3682 && y >= 142 && y <= 1865;
  };

  const isNearSunbath = (x, y) => {
    return (
      (x >= 1450 && x <= 1725 && y >= 1150 && y <= 1425) || // Spot 1
      (x >= 1450 && x <= 1725 && y >= 725 && y <= 925) || // Spot 2
      (x >= 675 && x <= 950 && y >= 725 && y <= 925) || // Spot 3
      (x >= 675 && x <= 950 && y >= 1150 && y <= 1425) // Spot 4
    );
  };

  const isNearSandcastle = (x, y) => {
    return (
      (x >= 1850 && x <= 1975 && y >= 1375 && y <= 1675) || // Spot 1
      (x >= 400 && x <= 550 && y >= 600 && y <= 675) // Spot 2
    );
  };

  const isNearSeashell = (x, y) => {
    return (
      (x >= 2100 && x <= 2200 && y >= 275 && y <= 500) || // Spot 1
      (x >= 1250 && x <= 1350 && y >= 750 && y <= 950)
    );
  };

  const isNearFlower = (x, y) => {
    return (
      (x >= 625 && x <= 925 && y >= 1740 && y <= 1865) || // Spot 1
      (x >= 825 && x <= 1275 && y >= 290 && y <= 465) // Spot 2
    );
  };

  const isNearStarFish = (x, y) => {
    return (
      (x >= 2000 && x <= 2125 && y >= 1625 && y <= 1825) || // Spot 1
      (x >= 1150 && x <= 1275 && y >= 1225 && y <= 1450) || // Spot 2
      (x >= 375 && x <= 475 && y >= 300 && y <= 475)
    );
  };

  const dialogMessages = {
    Swim: "Do you want to go for a swim?",
    Sunbath: "Do you want to relax and sunbathe?",
    Sandcastle: "Do you want to build a sandcastle?",
    Seashell: "Do you want to pick up the seashell?",
    Flower: "Do you want to pick up the flower?",
    StarFish: "Do you want to pick up the star fish?",
  };

  const renderDialogMessage = (message) => {
    return message.split("\n").map((line, idx) => <p key={idx}>{line}</p>);
  };

  // Clean up activity interval on unmount
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
      if (beachRef.current) {
        setActualViewportSize({
          width: beachRef.current.clientWidth,
          height: beachRef.current.clientHeight,
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
    if (isPerformingActivity) return; // Don't show dialogs during activities

    if (isNearSwim(playerPos.x, playerPos.y)) {
      setCurrentLocationbeach("Swim");
      setShowDialog(true);
    } else if (isNearSunbath(playerPos.x, playerPos.y)) {
      setCurrentLocationbeach("Sunbath");
      setShowDialog(true);
    } else if (isNearSandcastle(playerPos.x, playerPos.y)) {
      setCurrentLocationbeach("Sandcastle");
      setShowDialog(true);
    } else if (isNearSeashell(playerPos.x, playerPos.y)) {
      setCurrentLocationbeach("Seashell");
      setShowDialog(true);
    } else if (isNearFlower(playerPos.x, playerPos.y)) {
      setCurrentLocationbeach("Flower");
      setShowDialog(true);
    } else if (isNearStarFish(playerPos.x, playerPos.y)) {
      setCurrentLocationbeach("StarFish");
      setShowDialog(true);
    } else {
      // IMPORTANT: Clear dialog when not near any location
      setCurrentLocationbeach(null);
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
    <div className="beach-game-container">
      <div>
        <StatsPlayer stats={playerStats} onStatsUpdate={setPlayerStats} />
        <SpeedToggleButton />
        <BackTo type="map" onClick={handleBackToMap} /> {/* UPDATED: Using BackTo component */}
      </div>

      <div className="beach-game-viewport" ref={beachRef}>
        {showDialog && currentLocationbeach && !isPerformingActivity && (
          <div className="dialog fade-in-center">
            {renderDialogMessage(dialogMessages[currentLocationbeach] || `Do you want to enter the ${currentLocationbeach}?`)}
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
          className="beach-game-world beach-background"
          style={{
            width: `${WORLD_WIDTH}px`,
            height: `${WORLD_HEIGHT}px`,
            transform: `translate(-${cameraPos.x * zoomLevel}px, -${cameraPos.y * zoomLevel}px) scale(${zoomLevel})`,
            transformOrigin: "0 0",
          }}
        >
          <div
            className="beach-player"
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
            <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="beach-player-sprite" draggable={false} style={{ width: "100%", height: "100%" }} />
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
          <div>🗺️ Explore the beach!</div>
        </div>
      </div>

      <ArrowKey onKeyPress={handleArrowPress} />

      <Task currentLocation="beach" isInsideLocation={true} customPosition={{ top: "65px" }} externalTasks={playerStats.tasks} onTaskComplete={toggleTaskCompletion} />
    </div>
  );
}

export default Beach;
