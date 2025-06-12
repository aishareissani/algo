import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";
import { useSpeedMode, SpeedToggleButton } from "./speed";
import BackTo from "./BackTo";
import Inventory from "./inventory";
import "../mountain.css";
import WASDKey from "./wasd_key";
import Task from "./task";
import Gif from "./gif";
import { playSound, startWalkingSound, stopWalkingSound, stopBackgroundMusic, playBackgroundMusic, musicHealthCheck } from "./sound";
import GameOver from "./game_over";
import { handleUseItem } from "../utils/itemHandlers"; // Assuming you have this utility

function Mountain() {
  const { isFastForward } = useSpeedMode();
  const location = useLocation();
  const navigate = useNavigate();

  const { characterName = "manda", playerName = "Player", stats: initialStats = {} } = location.state || {};

  // Inisialisasi visitedLocations dari localStorage
  const [visitedLocations, setVisitedLocations] = useState(() => {
    const stored = localStorage.getItem("gameVisitedLocations");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const [showDialog, setShowDialog] = useState(false);
  const [currentLocationmountain, setCurrentLocationmountain] = useState(null);
  const [isPerformingActivity, setIsPerformingActivity] = useState(false);
  const [activityProgress, setActivityProgress] = useState(0);
  const [currentActivity, setCurrentActivity] = useState("");
  const [currentGifActivity, setCurrentGifActivity] = useState("");
  const [showInventory, setShowInventory] = useState(false);
  const [showTasks, setShowTasks] = useState(true);
  const [mobileZoom, setMobileZoom] = useState(0.299);

  // States untuk sistem berjalan dan game over
  const [isWalking, setIsWalking] = useState(false);
  const [walkingDirection, setWalkingDirection] = useState("down");
  const [isGameOver, setIsGameOver] = useState(false);

  const [playerPos, setPlayerPos] = useState({ x: 2000, y: 1300 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(0.299);
  const [actualViewportSize, setActualViewportSize] = useState({ width: 0, height: 0 });

  const mountainRef = useRef(null);
  const playerRef = useRef(null);
  const activityIntervalRef = useRef(null);
  const moveIntervalRef = useRef(null);

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
    lastVisitedLocation: "home", // Ensure this default is consistent
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

  // Effect to mark "mountain" as visited when entering Mountain.jsx
  useEffect(() => {
    setVisitedLocations((prev) => {
      const newSet = new Set(prev);
      if (!newSet.has("mountain")) {
        newSet.add("mountain");
      }
      return newSet;
    });
  }, []); // Run only once on component mount

  useEffect(() => {
    localStorage.setItem("gameVisitedLocations", JSON.stringify([...visitedLocations]));
  }, [visitedLocations]);

  // Deteksi Game Over
  useEffect(() => {
    if (playerStats.health <= 0 || playerStats.sleep <= 0) {
      setIsGameOver(true);
      setShowDialog(false);
      stopBackgroundMusic();
      stopWalkingSound();
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
      }
      playSound("over");
    }
  }, [playerStats.health, playerStats.sleep]);

  // Inisialisasi tugas
  useEffect(() => {
    const taskLocations = {
      mountain: [
        { id: "hike", name: "Start a Hike", priority: "daily" },
        { id: "stream", name: "Visit the Stream", priority: "daily" },
        { id: "flower", name: "Collect Flower", priority: "bonus" },
        { id: "rock", name: "Collect some Rock", priority: "bonus" },
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
        return { ...prev, tasks: updatedTasks };
      }
      return prev;
    });
  }, []);

  const handleBackToMap = () => {
    navigate("/map", {
      state: {
        characterName,
        playerName,
        stats: { ...playerStats, lastVisitedLocation: "mountain" }, // Ensure lastVisitedLocation is updated before navigating back
      },
    });
  };

  const handleItemUse = (item) => {
    handleUseItem(item, setPlayerStats);
  };

  const completeTask = (taskId) => {
    const taskKey = `mountain-${taskId}`;
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

  const toggleTaskCompletion = (taskId) => {
    const taskKey = `mountain-${taskId}`;
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

  const performActivity = (activityName, statChanges, gifActivity, collectItem = null) => {
    if (isPerformingActivity) return;

    setIsPerformingActivity(true);
    setCurrentActivity(activityName);
    setCurrentGifActivity(gifActivity);
    setActivityProgress(0);
    setShowDialog(false);

    // Menandai tugas sebagai selesai
    if (currentLocationmountain === "Hike") {
      completeTask("hike");
    } else if (currentLocationmountain === "Stream") {
      completeTask("stream");
    } else if (currentLocationmountain === "Flower") {
      completeTask("flower");
    } else if (currentLocationmountain === "Rock") {
      completeTask("rock");
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
          setCurrentGifActivity("");
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
          setCurrentGifActivity("");
        }
      }, ACTIVITY_UPDATE_INTERVAL);
    }
  };

  // Location-specific activity definitions
  const handleEnterLocation = () => {
    if (currentLocationmountain === "Hike") {
      performActivity(
        "Hiking",
        {
          energy: -20,
          happiness: 25,
          experience: 2,
          health: -5,
        },
        "hiking"
      );
    } else if (currentLocationmountain === "Stream") {
      performActivity(
        "Visiting Stream",
        {
          happiness: 15,
          energy: 10,
          cleanliness: 5,
          experience: 1,
        },
        "stream"
      );
    } else if (currentLocationmountain === "Flower") {
      performActivity(
        "Collecting Flower",
        {
          happiness: 10,
          experience: 1,
        },
        "collecting flower",
        {
          name: "Wild Flower",
          category: "Collectible",
          icon: "flower_icon", // Make sure you have this icon
        }
      );
    } else if (currentLocationmountain === "Rock") {
      performActivity(
        "Collecting Rock",
        {
          happiness: 5,
          experience: 0.5,
        },
        "collecting rock",
        {
          name: "Cool Rock",
          category: "Collectible",
          icon: "rock_icon", // Make sure you have this icon
        }
      );
    }
  };

  // Sistem Pergerakan (Unchanged)
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

  const startMovement = useCallback(
    (direction) => {
      if (isGameOver || isPerformingActivity) return;
      startWalkingSound(900);
      setIsWalking(true);
      setWalkingDirection(direction);
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }
      handleArrowPress(direction);
      moveIntervalRef.current = setInterval(() => {
        handleArrowPress(direction);
      }, 40);
    },
    [isGameOver, isPerformingActivity, handleArrowPress]
  );

  const stopMovement = useCallback(() => {
    setIsWalking(false);
    stopWalkingSound();
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
  }, []);

  // Keyboard Handler (Unchanged)
  useEffect(() => {
    const keysPressed = new Set();
    const handleKeyDown = (e) => {
      if (isGameOver || isPerformingActivity || keysPressed.has(e.key)) return;
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
        keysPressed.add(e.key);
        startMovement(direction);
      }
    };

    const handleKeyUp = (e) => {
      const walkKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "W", "a", "A", "s", "S", "d", "D"];
      if (walkKeys.includes(e.key)) {
        keysPressed.delete(e.key);
        const stillWalking = walkKeys.some((key) => keysPressed.has(key));
        if (!stillWalking) {
          stopMovement();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }
    };
  }, [isGameOver, isPerformingActivity, startMovement, stopMovement]);

  // Fungsi Deteksi Lokasi di dalam Mountain
  const isNearHike = (x, y) => x >= 1000 && x <= 1300 && y >= 300 && y <= 600;
  const isNearStream = (x, y) => x >= 2500 && x <= 2800 && y >= 800 && y <= 1100;
  const isNearFlower = (x, y) => x >= 500 && x <= 750 && y >= 1500 && y <= 1750;
  const isNearRock = (x, y) => x >= 3000 && x <= 3300 && y >= 200 && y <= 450;

  const dialogMessages = {
    Hike: "Do you want to start a hike?",
    Stream: "Do you want to visit the stream?",
    Flower: "Do you want to collect a wild flower?",
    Rock: "Do you want to collect some cool rocks?",
  };

  const renderDialogMessage = (message) => {
    return message.split("\n").map((line, idx) => <p key={idx}>{line}</p>);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
    };
  }, []);

  // Viewport calculations (Unchanged)
  useEffect(() => {
    const updateViewportSize = () => {
      if (mountainRef.current) {
        setActualViewportSize({
          width: mountainRef.current.clientWidth,
          height: mountainRef.current.clientHeight,
        });
      }
    };
    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  useEffect(() => {
    const calculateMobileZoom = () => {
      if (actualViewportSize.width === 0 || actualViewportSize.height === 0) return;
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const widthZoom = actualViewportSize.width / WORLD_WIDTH;
        const heightZoom = actualViewportSize.height / WORLD_HEIGHT;
        const optimalZoom = Math.max(widthZoom, heightZoom);
        const minZoom = 0.15;
        const maxZoom = 0.8;
        const finalZoom = Math.max(minZoom, Math.min(maxZoom, optimalZoom));
        setMobileZoom(finalZoom);
        setZoomLevel(finalZoom);
      } else {
        setZoomLevel(0.299);
      }
    };
    calculateMobileZoom();
    window.addEventListener("resize", calculateMobileZoom);
    return () => window.removeEventListener("resize", calculateMobileZoom);
  }, [actualViewportSize, WORLD_WIDTH, WORLD_HEIGHT]);

  useEffect(() => {
    if (actualViewportSize.width === 0 || actualViewportSize.height === 0 || zoomLevel === 0) return;
    const viewportWidthInWorld = actualViewportSize.width / zoomLevel;
    const viewportHeightInWorld = actualViewportSize.height / zoomLevel;
    let targetCameraX = playerPos.x - viewportWidthInWorld / 2;
    let targetCameraY = playerPos.y - viewportHeightInWorld / 2;
    targetCameraX = Math.max(0, Math.min(WORLD_WIDTH - viewportWidthInWorld, targetCameraX));
    targetCameraY = Math.max(0, Math.min(WORLD_HEIGHT - viewportHeightInWorld, targetCameraY));
    setCameraPos({ x: targetCameraX, y: targetCameraY });
  }, [playerPos, zoomLevel, actualViewportSize, WORLD_WIDTH, WORLD_HEIGHT]);

  // Deteksi Lokasi di Mountain
  useEffect(() => {
    if (isPerformingActivity) return;
    if (isNearHike(playerPos.x, playerPos.y)) {
      setCurrentLocationmountain("Hike");
      setShowDialog(true);
    } else if (isNearStream(playerPos.x, playerPos.y)) {
      setCurrentLocationmountain("Stream");
      setShowDialog(true);
    } else if (isNearFlower(playerPos.x, playerPos.y)) {
      setCurrentLocationmountain("Flower");
      setShowDialog(true);
    } else if (isNearRock(playerPos.x, playerPos.y)) {
      setCurrentLocationmountain("Rock");
      setShowDialog(true);
    } else {
      setCurrentLocationmountain(null);
      setShowDialog(false);
    }
  }, [playerPos, isPerformingActivity, isNearHike, isNearStream, isNearFlower, isNearRock]);

  return (
    <div className="mountain-game-container">
      {/* Pass onNewGame and onMainMenu to GameOver component */}
      {isGameOver && (
        <GameOver
          playerStats={playerStats}
          tasks={playerStats.tasks || {}}
          visitedLocations={visitedLocations} // Pass visitedLocations directly
          usedItems={new Set()}
          playtime={0}
          characterName={characterName}
          playerName={playerName}
          isGameOver={true}
          // Assuming Map.jsx will be the one rendering GameOver, it will pass these functions.
          // If you render GameOver directly from Mountain, you'd need to define them here too.
        />
      )}

      {!isGameOver && (
        <div>
          <StatsPlayer stats={playerStats} onStatsUpdate={setPlayerStats} onUseItem={handleItemUse} />
          <SpeedToggleButton />
          <BackTo type="map" onClick={handleBackToMap} />
        </div>
      )}

      <div className="mountain-game-viewport" ref={mountainRef}>
        {!isGameOver && showDialog && currentLocationmountain && !isPerformingActivity && (
          <div className="dialog fade-in-center">
            {renderDialogMessage(dialogMessages[currentLocationmountain] || `Do you want to enter the ${currentLocationmountain}?`)}
            <button className="yes-btn" onClick={handleEnterLocation}>
              Yes
            </button>
            <button className="no-btn" onClick={() => setShowDialog(false)}>
              No
            </button>
          </div>
        )}

        {!isGameOver && isPerformingActivity && (
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
          className="mountain-game-world mountain-background"
          style={{
            width: `${WORLD_WIDTH}px`,
            height: `${WORLD_HEIGHT}px`,
            transform: `translate(-${cameraPos.x * zoomLevel}px, -${cameraPos.y * zoomLevel}px) scale(${zoomLevel})`,
            transformOrigin: "0 0",
            pointerEvents: isGameOver ? "none" : "auto",
          }}
        >
          <div
            className="mountain-player"
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
            {isWalking ? (
              <Gif activity="jalan" location="gunung" isWalking={isWalking} characterName={characterName} walkingDirection={walkingDirection} />
            ) : isPerformingActivity && currentGifActivity ? (
              <Gif activity={currentGifActivity} location="gunung" isWalking={false} characterName={characterName} />
            ) : (
              <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="mountain-player-sprite" draggable={false} style={{ width: "100%", height: "100%" }} />
            )}
          </div>
        </div>
      </div>

      {!isGameOver && (
        <div className="game-hud">
          <div className="player-info">
            <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="hud-avatar" />
            <div className="player-coords">
              {playerName.toUpperCase()} • X: {Math.floor(playerPos.x)} Y: {Math.floor(playerPos.y)}
            </div>
          </div>
          <div className="controls-hint">
            <div>🎮 Arrow Keys / WASD to move</div>
            <div>🗺️ Explore the mountain!</div>
          </div>
        </div>
      )}

      {!isGameOver && (
        <>
          {showInventory && <Inventory items={playerStats.items} onClose={() => setShowInventory(false)} onUseItem={handleItemUse} />}
          <WASDKey onStartMovement={startMovement} onStopMovement={stopMovement} isMapLocation={false} isWalking={isWalking} walkingDirection={walkingDirection} />
          <Task currentLocation="mountain" isInsideLocation={true} customPosition={{ top: "65px" }} externalTasks={playerStats.tasks} onTaskComplete={toggleTaskCompletion} />
        </>
      )}
    </div>
  );
}

export default Mountain;
