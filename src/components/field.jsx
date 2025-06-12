import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";
import { useSpeedMode, SpeedToggleButton } from "./speed";
import BackTo from "./BackTo";
import "../field.css";
import WASDKey from "./wasd_key";
import Task from "./task";
import Gif from "./gif";
import { playSound, startWalkingSound, stopWalkingSound, stopBackgroundMusic, playBackgroundMusic, musicHealthCheck } from "./sound";
import GameOver from "./game_over";
// Assuming you have an itemHandlers utility if "collectItem" is used
// import { handleUseItem } from "../utils/itemHandlers"; // Uncomment if you have this

function Field() {
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
  const [currentLocationfield, setCurrentLocationfield] = useState(null);
  const [isPerformingActivity, setIsPerformingActivity] = useState(false);
  const [activityProgress, setActivityProgress] = useState(0);
  const [currentActivity, setCurrentActivity] = useState("");
  const [currentGifActivity, setCurrentGifActivity] = useState("");
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

  const fieldRef = useRef(null);
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
    lastVisitedLocation: "home",
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

  useEffect(() => {
    localStorage.setItem("gameVisitedLocations", JSON.stringify([...visitedLocations]));
  }, [visitedLocations]);

  // Mark field as visited when entering the location
  useEffect(() => {
    setVisitedLocations((prev) => {
      const newSet = new Set(prev);
      if (!newSet.has("field")) {
        newSet.add("field");
      }
      return newSet;
    });
  }, []); // Run only once on component mount

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
      field: [
        { id: "swing", name: "Sit on the Swing", priority: "daily" },
        { id: "picnic", name: "Have a Picnic", priority: "daily" },
        { id: "chair", name: "Rest on Chair", priority: "bonus" },
        { id: "fountain", name: "Near Fountain", priority: "bonus" },
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
        stats: { ...playerStats, lastVisitedLocation: "field" }, // Ensure lastVisitedLocation is updated
      },
    });
  };

  const completeTask = (taskId) => {
    const taskKey = `field-${taskId}`;
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
    const taskKey = `field-${taskId}`;
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

  // Assuming addItemToInventory is defined elsewhere or not used in field activities
  // If it's used for collecting items in the field, you'll need to define it or import it.
  const addItemToInventory = (itemName, category, icon, onStatsUpdate) => {
    onStatsUpdate((prev) => {
      const existingItemIndex = prev.items.findIndex((item) => item.name === itemName);
      const updatedItems = [...prev.items];
      const newExperience = prev.experience + 1; // Assuming collecting gives XP

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
    if (currentLocationfield === "Swing") {
      completeTask("swing");
    } else if (currentLocationfield === "Picnic") {
      completeTask("picnic");
    } else if (currentLocationfield === "Chair") {
      completeTask("chair");
    } else if (currentLocationfield === "Fountain") {
      completeTask("fountain");
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
    if (currentLocationfield === "Swing") {
      performActivity(
        "Swinging",
        {
          sleep: -30,
          energy: -25,
          health: 20,
          happiness: 40,
          experience: 1,
        },
        "main ayunan"
      );
    } else if (currentLocationfield === "Picnic") {
      performActivity(
        "Taking a Picnic",
        {
          happiness: 30,
          meal: 50,
          experience: 1,
        },
        "piknik"
      );
    } else if (currentLocationfield === "Chair") {
      performActivity(
        "Sit",
        {
          happiness: 20,
          energy: 20,
          experience: 1,
        },
        "duduk2 di kursi"
      );
    } else if (currentLocationfield === "Fountain") {
      performActivity(
        "Making a wish",
        {
          happiness: 40,
          money: -5,
          experience: 1,
        },
        "lempar koin"
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

  // Location Detection Functions
  const isNearSwing = (x, y) => x >= 2450 && x <= 2825 && y >= 142 && y <= 475;
  const isNearPicnic = (x, y) => x >= 750 && x <= 1150 && y >= 975 && y <= 1575;
  const isNearChair = (x, y) => x >= 725 && x <= 1075 && y >= 200 && y <= 450;
  const isNearFountain = (x, y) => x >= 1750 && x <= 2175 && y >= 700 && y <= 1175;

  const dialogMessages = {
    Swing: "Do you want to use the swing?",
    Picnic: "Do you want to have a picnic?",
    Chair: "Do you want to sit on the chair?",
    Fountain: "Do you want to throw a coin and make a wish?",
  };

  const renderDialogMessage = (message) => {
    return message.split("\n").map((line, idx) => <p key={idx}>{line}</p>);
  };

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
      if (fieldRef.current) {
        setActualViewportSize({
          width: fieldRef.current.clientWidth,
          height: fieldRef.current.clientHeight,
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
  useEffect(() => {
    if (isPerformingActivity) return;

    let newLocation = null;
    if (isNearSwing(playerPos.x, playerPos.y)) newLocation = "Swing";
    else if (isNearPicnic(playerPos.x, playerPos.y)) newLocation = "Picnic";
    else if (isNearChair(playerPos.x, playerPos.y)) newLocation = "Chair";
    else if (isNearFountain(playerPos.x, playerPos.y)) newLocation = "Fountain";

    if (newLocation) {
      setCurrentLocationfield(newLocation);
      if (!dialogDismissed) setShowDialog(true);
    } else {
      setCurrentLocationfield(null);
      setShowDialog(false);
      setDialogDismissed(false); // Reset dismiss saat keluar area!
    }
  }, [playerPos, isPerformingActivity, dialogDismissed]);

  return (
    <div className="field-game-container">
      {/* Pass visitedLocations to GameOver component */}
      {isGameOver && <GameOver playerStats={playerStats} tasks={playerStats.tasks || {}} visitedLocations={visitedLocations} usedItems={new Set()} playtime={0} characterName={characterName} playerName={playerName} isGameOver={true} />}

      {!isGameOver && (
        <div>
          <StatsPlayer stats={playerStats} onStatsUpdate={setPlayerStats} /* Removed onUseItem as it's not defined or passed in this component */ />
          <SpeedToggleButton />
          <BackTo type="map" onClick={handleBackToMap} />
        </div>
      )}

      <div className="field-game-viewport" ref={fieldRef}>
        {!isGameOver && showDialog && currentLocationfield && !isPerformingActivity && (
          <div className="dialog fade-in-center">
            {renderDialogMessage(dialogMessages[currentLocationfield] || `Do you want to enter the ${currentLocationfield}?`)}
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
          className="field-game-world field-background"
          style={{
            width: `${WORLD_WIDTH}px`,
            height: `${WORLD_HEIGHT}px`,
            transform: `translate(-${cameraPos.x * zoomLevel}px, -${cameraPos.y * zoomLevel}px) scale(${zoomLevel})`,
            transformOrigin: "0 0",
            pointerEvents: isGameOver ? "none" : "auto",
          }}
        >
          <div
            className="field-player"
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
              <Gif activity="jalan" location="lapangan" isWalking={isWalking} characterName={characterName} walkingDirection={walkingDirection} />
            ) : isPerformingActivity && currentGifActivity ? (
              <Gif activity={currentGifActivity} location="lapangan" isWalking={false} characterName={characterName} />
            ) : (
              <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="field-player-sprite" draggable={false} style={{ width: "100%", height: "100%" }} />
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
            <div>🗺️ Explore the field!</div>
          </div>
        </div>
      )}

      {!isGameOver && (
        <>
          <WASDKey onStartMovement={startMovement} onStopMovement={stopMovement} isMapLocation={false} isWalking={isWalking} walkingDirection={walkingDirection} />
          <Task currentLocation="field" isInsideLocation={true} customPosition={{ top: "65px" }} externalTasks={playerStats.tasks} onTaskComplete={toggleTaskCompletion} />
        </>
      )}
    </div>
  );
}

export default Field;
