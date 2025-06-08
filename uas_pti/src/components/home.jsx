import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";
import { useSpeedMode, SpeedToggleButton } from "./speed";
import Inventory from "./inventory";
import { handleUseItem } from "../utils/itemHandlers";
import "../home.css";
import ArrowKey from "./wasd_key";
import Task from "./task";

function Home() {
  const { isFastForward } = useSpeedMode();
  const location = useLocation();
  const navigate = useNavigate();

  const { characterName = "claire", playerName = "Player", stats: initialStats = {} } = location.state || {};
  const [showDialog, setShowDialog] = useState(false);
  const [currentLocationHouse, setCurrentLocationHouse] = useState(null);
  const [isPerformingActivity, setIsPerformingActivity] = useState(false);
  const [activityProgress, setActivityProgress] = useState(0);
  const [currentActivity, setCurrentActivity] = useState("");

  const [showInventory, setShowInventory] = useState(false);
  const [showTasks, setShowTasks] = useState(true);

  const [playerPos, setPlayerPos] = useState({ x: 2000, y: 1300 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(0.299);
  const [actualViewportSize, setActualViewportSize] = useState({ width: 0, height: 0 });

  const houseRef = useRef(null);
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
    tasks: {}, // Make sure tasks is always included
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

  // Initialize tasks if they don't exist
  useEffect(() => {
    const taskLocations = {
      home: [
        { id: "bed", name: "Rest on Bed", priority: "daily" },
        { id: "bath", name: "Take Bath", priority: "daily" },
        { id: "kitchen", name: "Eat in the Kitchen", priority: "daily" },
        { id: "cat", name: "Pet the Cat", priority: "bonus" },
        { id: "table", name: "Work from Home", priority: "bonus" },
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
        stats: playerStats, // Pass the entire playerStats including tasks
      },
    });
  };

  const handleItemUse = (item) => {
    handleUseItem(item, setPlayerStats);
  };

  // Function to mark a task as completed
  const completeTask = (taskId) => {
    const taskKey = `home-${taskId}`;
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
    const taskKey = `home-${taskId}`;
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

  const performActivity = (activityName, statChanges) => {
    if (isPerformingActivity) return;

    setIsPerformingActivity(true);
    setCurrentActivity(activityName);
    setActivityProgress(0);
    setShowDialog(false);

    // Mark corresponding task as completed
    if (currentLocationHouse === "Bed") {
      completeTask("bed");
    } else if (currentLocationHouse === "Bath") {
      completeTask("bath");
    } else if (currentLocationHouse === "Kitchen") {
      completeTask("kitchen");
    } else if (currentLocationHouse === "Cat") {
      completeTask("cat");
    } else if (currentLocationHouse === "Table") {
      completeTask("table");
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
          clearInterval(activityIntervalRef.current);
          setIsPerformingActivity(false);
          setActivityProgress(0);
          setCurrentActivity("");
        }
      }, ACTIVITY_UPDATE_INTERVAL);
    }
  };

  const handleEnterLocation = () => {
    console.log(`Performing activity at ${currentLocationHouse}`);

    if (currentLocationHouse === "Bed") {
      performActivity("Sleeping", {
        sleep: 100,
        energy: 25,
        health: -40,
        happiness: 15,
        experience: 1,
      });
    } else if (currentLocationHouse === "Bath") {
      performActivity("Taking a bath", {
        cleanliness: 100,
        happiness: 20,
        experience: 1,
      });
    } else if (currentLocationHouse === "Kitchen") {
      performActivity("Eating", {
        meal: 40,
        happiness: 20,
        experience: 1,
      });
    } else if (currentLocationHouse === "Cat") {
      performActivity("Playing with cat", {
        happiness: 50,
        experience: 1,
      });
    } else if (currentLocationHouse === "Table") {
      performActivity("Working from home", {
        money: 100,
        energy: -15,
        sleep: -10,
        meal: -10,
        happiness: -10,
        skillPoints: 1,
      });
    }
  };

  useEffect(() => {
    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
    };
  }, []);

  const isNearBed = (x, y) => {
    return x >= 450 && x <= 700 && y >= 142 && y <= 617;
  };
  const isNearBath = (x, y) => {
    return x >= 142 && x <= 1092 && y >= 1015 && y <= 1617;
  };
  const isNearKitchen = (x, y) => {
    return x >= 3250 && x <= 3550 && y >= 650 && y <= 1000;
  };
  const isNearCat = (x, y) => {
    return x >= 1992 && x <= 2242 && y >= 1342 && y <= 1642;
  };
  const isNearTable = (x, y) => {
    return x >= 1875 && x <= 2125 && y >= 400 && y <= 750;
  };

  const dialogMessages = {
    Bed: "Do you want to sleep?",
    Bath: "Do you want to take a bath?",
    Kitchen: "Do you want to eat?",
    Cat: "Do you want to play with cat?",
    Table: "Do you want to work from home?",
  };

  const renderDialogMessage = (message) => {
    return message.split("\n").map((line, idx) => <p key={idx}>{line}</p>);
  };

  useEffect(() => {
    const updateViewportSize = () => {
      if (houseRef.current) {
        setActualViewportSize({
          width: houseRef.current.clientWidth,
          height: houseRef.current.clientHeight,
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

    if (isNearBed(playerPos.x, playerPos.y)) {
      setCurrentLocationHouse("Bed");
      setShowDialog(true);
    } else if (isNearBath(playerPos.x, playerPos.y)) {
      setCurrentLocationHouse("Bath");
      setShowDialog(true);
    } else if (isNearKitchen(playerPos.x, playerPos.y)) {
      setCurrentLocationHouse("Kitchen");
      setShowDialog(true);
    } else if (isNearCat(playerPos.x, playerPos.y)) {
      setCurrentLocationHouse("Cat");
      setShowDialog(true);
    } else if (isNearTable(playerPos.x, playerPos.y)) {
      setCurrentLocationHouse("Table");
      setShowDialog(true);
    } else {
      setCurrentLocationHouse(null);
      setShowDialog(false);
    }
  }, [playerPos, isPerformingActivity]);

  useEffect(() => {
    console.log("Current player stats:", playerStats);
  }, [playerStats]);

  return (
    <div className="home-game-container">
      <div>
        <StatsPlayer stats={playerStats} onStatsUpdate={setPlayerStats} onUseItem={handleItemUse} />
        <SpeedToggleButton />
      </div>

      <div className="home-game-viewport" ref={houseRef}>
        {showDialog && currentLocationHouse && !isPerformingActivity && (
          <div className="dialog fade-in-center">
            {renderDialogMessage(dialogMessages[currentLocationHouse] || `Do you want to enter the ${currentLocationHouse}?`)}
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
          className="home-game-world home-background"
          style={{
            width: `${WORLD_WIDTH}px`,
            height: `${WORLD_HEIGHT}px`,
            transform: `translate(-${cameraPos.x * zoomLevel}px, -${cameraPos.y * zoomLevel}px) scale(${zoomLevel})`,
            transformOrigin: "0 0",
          }}
        >
          <div
            className="home-player"
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
            <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="home-player-sprite" draggable={false} style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
      </div>

      <div className="game-hud">
        <div className="player-info">
          <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="hud-avatar" />
          <div className="player-coords">
            {playerName.toUpperCase()} • X: {Math.floor(playerPos.x)} Y: {Math.floor(playerPos.y)}
            <button className="back-to-map-button-inline" onClick={handleBackToMap}>
              Back to Map
            </button>
          </div>
        </div>
        <div className="controls-hint">
          <div>🎮 Arrow Keys / WASD to move</div>
          <div>🗺️ Explore the home!</div>
        </div>
      </div>

      <ArrowKey onKeyPress={handleArrowPress} />

      <Task currentLocation="home" isInsideLocation={true} customPosition={{ top: "65px" }} externalTasks={playerStats.tasks} onTaskComplete={toggleTaskCompletion} />
    </div>
  );
}

export default Home;
