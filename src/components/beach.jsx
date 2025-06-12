import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";
import { useSpeedMode, SpeedToggleButton } from "./speed";
import BackTo from "./BackTo";
import "../beach.css";
import WASDKey from "./wasd_key";
import Task from "./task";
import Gif from "./gif";
import { playSound, startWalkingSound, stopWalkingSound, stopBackgroundMusic, playBackgroundMusic, musicHealthCheck } from "./sound";
import GameOver from "./game_over";
import { handleUseItem } from "../utils/itemHandlers"; // Assuming you have this utility

function Beach() {
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
  const [currentLocationbeach, setCurrentLocationbeach] = useState(null);
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

  const beachRef = useRef(null);
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

  // Mark beach as visited when entering the location
  useEffect(() => {
    setVisitedLocations((prev) => {
      const newSet = new Set(prev);
      if (!newSet.has("beach")) {
        newSet.add("beach");
      }
      return newSet;
    });
  }, []);

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
        return { ...prev, tasks: updatedTasks };
      }
      return prev;
    });
  }, []);

  const handleBackToMap = () => {
    navigate("/map", {
      state: { characterName, playerName, stats: { ...playerStats, lastVisitedLocation: "beach" } }, // Ensure lastVisitedLocation is updated
    });
  };

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
    if (currentLocationbeach === "Swim") {
      performActivity(
        "Swimming",
        {
          energy: -25,
          happiness: 40,
          health: 10,
          meal: -20,
          experience: 1,
        },
        "berenang"
      );
    } else if (currentLocationbeach === "Sunbath") {
      performActivity(
        "Taking a Sunbath",
        {
          happiness: 30,
          energy: 10,
          experience: 1,
        },
        "berjemur"
      );
    } else if (currentLocationbeach === "Sandcastle") {
      performActivity(
        "Making a sand castle",
        {
          happiness: 50,
          energy: 20,
          meal: -5,
          cleanliness: -10,
          skillPoints: 1,
        },
        "buat istana pasir"
      );
    } else if (currentLocationbeach === "Seashell") {
      performActivity(
        "Picking seashell",
        {
          happiness: 40,
          energy: -20,
          meal: -20,
          skillPoints: 1,
        },
        "simpan kerang",
        {
          name: "Conch Shell",
          category: "Marine",
          icon: "conch-shell",
        }
      );
    } else if (currentLocationbeach === "Flower") {
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
        "simpan bunga pantai",
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
        "simpan bintang laut", // Corrected GIF activity description for starfish
        {
          name: "Starfish",
          category: "Marine",
          icon: "starfish",
        }
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
  const isNearSwim = (x, y) => x >= 2275 && x <= 3682 && y >= 142 && y <= 1865;
  const isNearSunbath = (x, y) => (x >= 1450 && x <= 1725 && y >= 1150 && y <= 1425) || (x >= 1450 && x <= 1725 && y >= 725 && y <= 925) || (x >= 675 && x <= 950 && y >= 725 && y <= 925) || (x >= 675 && x <= 950 && y >= 1150 && y <= 1425);
  const isNearSandcastle = (x, y) => (x >= 1850 && x <= 1975 && y >= 1375 && y <= 1675) || (x >= 400 && x <= 550 && y >= 600 && y <= 675);
  const isNearSeashell = (x, y) => (x >= 2100 && x <= 2200 && y >= 275 && y <= 500) || (x >= 1250 && x <= 1350 && y >= 750 && y <= 950);
  const isNearFlower = (x, y) => (x >= 625 && x <= 925 && y >= 1740 && y <= 1865) || (x >= 825 && x <= 1275 && y >= 290 && y <= 465);
  const isNearStarFish = (x, y) => (x >= 2000 && x <= 2125 && y >= 1625 && y <= 1825) || (x >= 1150 && x <= 1275 && y >= 1225 && y <= 1450) || (x >= 375 && x <= 475 && y >= 300 && y <= 475);

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

  // Function to handle item use (from "../utils/itemHandlers")
  const handleItemUse = (item) => {
    handleUseItem(item, setPlayerStats);
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
      setCurrentLocationbeach(null);
      setShowDialog(false);
    }
  }, [playerPos, isPerformingActivity, isNearSwim, isNearSunbath, isNearSandcastle, isNearSeashell, isNearFlower, isNearStarFish]);

  return (
    <div className="beach-game-container">
      {/* Pass visitedLocations to GameOver component */}
      {isGameOver && <GameOver playerStats={playerStats} tasks={playerStats.tasks || {}} visitedLocations={visitedLocations} usedItems={new Set()} playtime={0} characterName={characterName} playerName={playerName} isGameOver={true} />}

      {!isGameOver && (
        <div>
          <StatsPlayer stats={playerStats} onStatsUpdate={setPlayerStats} onUseItem={handleItemUse} />
          <SpeedToggleButton />
          <BackTo type="map" onClick={handleBackToMap} />
        </div>
      )}

      <div className="beach-game-viewport" ref={beachRef}>
        {!isGameOver && showDialog && currentLocationbeach && !isPerformingActivity && (
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
          className="beach-game-world beach-background"
          style={{
            width: `${WORLD_WIDTH}px`,
            height: `${WORLD_HEIGHT}px`,
            transform: `translate(-${cameraPos.x * zoomLevel}px, -${cameraPos.y * zoomLevel}px) scale(${zoomLevel})`,
            transformOrigin: "0 0",
            pointerEvents: isGameOver ? "none" : "auto",
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
            {isWalking ? (
              <Gif activity="jalan" location="pantai" isWalking={isWalking} characterName={characterName} walkingDirection={walkingDirection} />
            ) : isPerformingActivity && currentGifActivity ? (
              <Gif activity={currentGifActivity} location="pantai" isWalking={false} characterName={characterName} />
            ) : (
              <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="beach-player-sprite" draggable={false} style={{ width: "100%", height: "100%" }} />
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
            <div>🗺️ Explore the beach!</div>
          </div>
        </div>
      )}

      {!isGameOver && (
        <>
          <WASDKey onStartMovement={startMovement} onStopMovement={stopMovement} isMapLocation={false} isWalking={isWalking} walkingDirection={walkingDirection} />
          <Task currentLocation="beach" isInsideLocation={true} customPosition={{ top: "65px" }} externalTasks={playerStats.tasks} onTaskComplete={toggleTaskCompletion} />
        </>
      )}
    </div>
  );
}

export default Beach;
