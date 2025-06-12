import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";
import Inventory from "./inventory";
import GameOver from "./game_over";
import { useSpeedMode, SpeedToggleButton } from "./speed";
import { handleUseItem } from "../utils/itemHandlers";
import WASDKey from "./wasd_key";
import Task from "./task";
import BackTo from "./BackTo";
import Gif from "./gif";
import { playSound, startWalkingSound, stopWalkingSound, stopBackgroundMusic, playBackgroundMusic, musicHealthCheck } from "./sound";
import "../restaurant.css";

function Resto() {
  const { isFastForward } = useSpeedMode();
  const location = useLocation();
  const navigate = useNavigate();
  const { characterName = "manda", playerName = "Player", stats: initialStats = {} } = location.state || {};

  // Initialize visitedLocations from localStorage
  const [visitedLocations, setVisitedLocations] = useState(() => {
    const stored = localStorage.getItem("gameVisitedLocations");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const [showDialog, setShowDialog] = useState(false);
  const [currentLocationResto, setcurrentLocationResto] = useState(null);
  const [isPerformingActivity, setIsPerformingActivity] = useState(false);
  const [activityProgress, setActivityProgress] = useState(0);
  const [currentActivity, setCurrentActivity] = useState("");
  const [currentGifActivity, setCurrentGifActivity] = useState("");
  const [showInventory, setShowInventory] = useState(false);
  const [showTasks, setShowTasks] = useState(true);
  const [mobileZoom, setMobileZoom] = useState(0.299);

  // States for walking system and game over
  const [isWalking, setIsWalking] = useState(false);
  const [walkingDirection, setWalkingDirection] = useState("down");
  const [isGameOver, setIsGameOver] = useState(false);

  const [playerPos, setPlayerPos] = useState({ x: 2000, y: 1300 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(0.299);
  const [actualViewportSize, setActualViewportSize] = useState({ width: 0, height: 0 });

  const restoRef = useRef(null);
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

  const [dialogDismissed, setDialogDismissed] = useState(false);

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

  // Effect to mark "restaurant" as visited when entering Resto.jsx
  useEffect(() => {
    setVisitedLocations((prev) => {
      const newSet = new Set(prev);
      if (!newSet.has("restaurant")) {
        newSet.add("restaurant");
      }
      return newSet;
    });
  }, []); // Run only once on component mount

  useEffect(() => {
    localStorage.setItem("gameVisitedLocations", JSON.stringify([...visitedLocations]));
  }, [visitedLocations]);

  // Detect Game Over
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
        return { ...prev, tasks: updatedTasks };
      }
      return prev;
    });
  }, []);

  const handlebackToMap = () => {
    navigate("/map", {
      state: {
        characterName,
        playerName,
        stats: { ...playerStats, lastVisitedLocation: "restaurant" }, // Ensure lastVisitedLocation is updated before navigating back
      },
    });
  };

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

  const performActivity = (activityName, statChanges, gifActivity, collectItem = null) => {
    if (isPerformingActivity) return;

    setIsPerformingActivity(true);
    setCurrentActivity(activityName);
    setCurrentGifActivity(gifActivity);
    setActivityProgress(0);
    setShowDialog(false);

    // Mark task as complete
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

  const handleEnterLocation = () => {
    if (currentLocationResto === "Takeaway") {
      performActivity(
        "Ordering Takeaway",
        {
          happiness: 20,
          money: -20,
          experience: 1,
        },
        "pesen takeaway",
        {
          name: "Takeaway Meal",
          category: "Daily",
          icon: "takeaway",
        }
      );
    } else if (currentLocationResto === "Eat") {
      performActivity(
        "Dining In",
        {
          happiness: 30,
          energy: 25,
          meal: 40,
          money: -20,
          experience: 1,
        },
        "pesan makan"
      );
    } else if (currentLocationResto === "Drink") {
      performActivity(
        "Having a Drink",
        {
          happiness: 15,
          energy: 25,
          meal: 10,
          money: -5,
          experience: 1,
        },
        "pesen minum"
      );
    }
  };

  // Movement System (Unchanged)
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

  // Function to handle item use (keep as is if it's external handler)
  const handleItemUse = (item) => {
    // This seems to be an external handler, so keep it as is.
    // If "Takeaway Meal" is an item that can be used from inventory,
    // ensure this function is called from your Inventory component.
    if (item.name !== "Takeaway Meal") return; // Example: only handle "Takeaway Meal" here
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

  // Function to handle item use (this one was repeated, removed the duplicate)
  // const handleItemUse = (item) => { handleUseItem(item, setPlayerStats); }; // This line was at the top, keep only one

  // Cleanup (Unchanged)
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

  // Location Detection for activities (Unchanged)
  const isNearCashier = (x, y) => x >= 2575 && x <= 2725 && y >= 142 && y <= 550;
  const isNearTable = (x, y) => (x >= 1750 && x <= 2050 && y >= 750 && y <= 1025) || (x >= 1750 && x <= 2050 && y >= 1375 && y <= 1725) || (x >= 525 && x <= 825 && y >= 1375 && y <= 1725) || (x >= 525 && x <= 825 && y >= 750 && y <= 1025);
  const isNearChair = (x, y) => x >= 2700 && x <= 3682 && y >= 975 && y <= 1200;

  const dialogMessages = {
    Takeaway: "Would you like to order some takeaway?",
    Eat: "Would you like to eat here at the restaurant?",
    Drink: "Would you like to sit down and enjoy a drink?",
  };

  const renderDialogMessage = (message) => {
    return message.split("\n").map((line, idx) => <p key={idx}>{line}</p>);
  };

  // Location Detection for activities (Unchanged)
  useEffect(() => {
    if (isPerformingActivity) return;

    let newLocation = null;
    if (isNearCashier(playerPos.x, playerPos.y)) newLocation = "Takeaway";
    else if (isNearTable(playerPos.x, playerPos.y)) newLocation = "Eat";
    else if (isNearChair(playerPos.x, playerPos.y)) newLocation = "Drink";

    if (newLocation) {
      setcurrentLocationResto(newLocation);
      if (!dialogDismissed) setShowDialog(true);
    } else {
      setcurrentLocationResto(null);
      setShowDialog(false);
      setDialogDismissed(false); // Reset dismiss saat keluar area!
    }
  }, [playerPos, isPerformingActivity, dialogDismissed]);

  return (
    <div className="resto-game-container">
      {/* Pass visitedLocations to GameOver component */}
      {isGameOver && <GameOver playerStats={playerStats} tasks={playerStats.tasks || {}} visitedLocations={visitedLocations} usedItems={new Set()} playtime={0} characterName={characterName} playerName={playerName} isGameOver={true} />}

      {!isGameOver && (
        <div>
          <StatsPlayer stats={playerStats} onStatsUpdate={setPlayerStats} onUseItem={handleItemUse} />
          <SpeedToggleButton />
          <BackTo type="map" onClick={handlebackToMap} />
        </div>
      )}

      <div className="resto-game-viewport" ref={restoRef}>
        {!isGameOver && showDialog && currentLocationResto && !isPerformingActivity && (
          <div className="dialog fade-in-center">
            {renderDialogMessage(dialogMessages[currentLocationResto] || `Do you want to enter the ${currentLocationResto}?`)}
            <button className="yes-btn" onClick={handleEnterLocation}>
              Yes
            </button>
            <button
              className="no-btn"
              onClick={() => {
                setShowDialog(false);
                setDialogDismissed(true);
              }}
            >
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
          className="resto-game-world resto-background"
          style={{
            width: `${WORLD_WIDTH}px`,
            height: `${WORLD_HEIGHT}px`,
            transform: `translate(-${cameraPos.x * zoomLevel}px, -${cameraPos.y * zoomLevel}px) scale(${zoomLevel})`,
            transformOrigin: "0 0",
            pointerEvents: isGameOver ? "none" : "auto",
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
            {isWalking ? (
              <Gif activity="jalan" location="restoran" isWalking={isWalking} characterName={characterName} walkingDirection={walkingDirection} />
            ) : isPerformingActivity && currentGifActivity ? (
              <Gif activity={currentGifActivity} location="restoran" isWalking={false} characterName={characterName} />
            ) : (
              <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="resto-player-sprite" draggable={false} style={{ width: "100%", height: "100%" }} />
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
            <div>🗺️ Explore the restaurant!</div>
          </div>
        </div>
      )}

      {!isGameOver && (
        <>
          {showInventory && <Inventory items={playerStats.items} onClose={() => setShowInventory(false)} onUseItem={handleItemUse} />}
          <WASDKey onStartMovement={startMovement} onStopMovement={stopMovement} isMapLocation={false} isWalking={isWalking} walkingDirection={walkingDirection} />
          <Task currentLocation="restaurant" isInsideLocation={true} customPosition={{ top: "65px" }} externalTasks={playerStats.tasks} onTaskComplete={toggleTaskCompletion} />
        </>
      )}
    </div>
  );
}

export default Resto;
