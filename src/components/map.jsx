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
import {
  playSound,
  startWalkingSound,
  stopWalkingSound,
  stopBackgroundMusic,
  stopMusicHealthCheck, // TAMBAH ini
} from "./sound";

function Map() {
  const { isFastForward } = useSpeedMode();
  const location = useLocation();
  const navigate = useNavigate();

  const { characterName = "manda", playerName = "Player", stats: passedStats } = location.state || {};

  const [playerPos, setPlayerPos] = useState({ x: 2110, y: 730 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });
  const [showDialog, setShowDialog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showTasks, setShowTasks] = useState(true);
  const [isPlayerInfoExpanded, setIsPlayerInfoExpanded] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Add tracking for GameOver data
  const [visitedLocations, setVisitedLocations] = useState(new Set(["home"]));
  const [usedItems, setUsedItems] = useState(new Set());
  const [gameStartTime] = useState(Date.now());

  const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

  const [isWalking, setIsWalking] = useState(false);
  const [walkingDirection, setWalkingDirection] = useState("down");

  const mapRef = useRef(null);
  const playerRef = useRef(null);
  const moveIntervalRef = useRef(null); // Add ref untuk interval

  const WORLD_WIDTH = 3700;
  const WORLD_HEIGHT = 1954;
  const PLAYER_SIZE = 80;
  const MOVE_SPEED = 8;

  // Location coordinates for pointers
  const mainMapLocationPointers = [
    { name: "home", x: 2150, y: 545, label: "Home" },
    { name: "field", x: 3045, y: 960, label: "Field" },
    { name: "beach", x: 3407, y: 906, label: "Beach" },
    { name: "restaurant", x: 1622, y: 990, label: "Restaurant" },
    { name: "mountain", x: 512, y: 537, label: "Mountain" },
  ];

  const miniMapLocationPointers = [
    { name: "home", x: 2150, y: 390, label: "Home" },
    { name: "field", x: 3045, y: 800, label: "Field" },
    { name: "beach", x: 3407, y: 750, label: "Beach" },
    { name: "restaurant", x: 1622, y: 870, label: "Restaurant" },
    { name: "mountain", x: 512, y: 420, label: "Mountain" },
  ];

  // Location Detection Functions
  const isNearHouse = (x, y) => x >= 1918 && x <= 2262 && y >= 430 && y <= 660;
  const isNearField = (x, y) => x >= 2894 && x <= 3160 && y >= 762 && y <= 1026;
  const isNearBeach = (x, y) => x >= 3238 && x <= 3575 && y >= 626 && y <= 1186;
  const isNearResto = (x, y) => x >= 1526 && x <= 1718 && y >= 898 && y <= 1058;
  const isNearGunung = (x, y) => x >= 176 && x <= 848 && y >= 40 && y <= 1034;

  const [playerStats, setPlayerStats] = useState(
    passedStats || {
      meal: 50,
      sleep: 50,
      health: 80,
      energy: 80,
      happiness: 50,
      cleanliness: 50,
      money: 100,
      experience: 0,
      level: 1,
      skillPoints: 0,
      items: [],
      tasks: {},
      lastVisitedLocation: "home",
    }
  );

  const [lastVisitedLocation, setLastVisitedLocation] = useState(passedStats?.lastVisitedLocation || "home");

  // Check for game over conditions
  useEffect(() => {
    if (playerStats.health <= 0 || playerStats.sleep <= 0) {
      setIsGameOver(true);
      setShowDialog(false);

      // STOP semua audio systems
      stopBackgroundMusic(); // Stop background music
      stopMusicHealthCheck(); // Stop auto-restart checker
      stopWalkingSound(); // Stop walking sound juga

      // Clear movement interval juga
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
      }

      // Play game over sound
      playSound("over");
    }
  }, [playerStats.health, playerStats.sleep]);

  // Check if current screen size should use minimized behavior
  const shouldUseMinimizedBehavior = () => {
    return window.innerWidth <= 1024;
  };

  // Update viewport size on resize and initial load
  useEffect(() => {
    const updateViewportSize = () => {
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        setViewportSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    const resizeObserver = new ResizeObserver(updateViewportSize);
    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateViewportSize);
      resizeObserver.disconnect();
    };
  }, []);

  // PERBAIKAN: Single handleArrowPress function
  const handleArrowPress = useCallback(
    (direction) => {
      if (isGameOver) return;

      setPlayerPos((prev) => {
        let newX = prev.x;
        let newY = prev.y;

        switch (direction) {
          case "up":
            newY = Math.max(0, prev.y - MOVE_SPEED);
            break;
          case "down":
            newY = Math.min(WORLD_HEIGHT - 100, prev.y + MOVE_SPEED);
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
    },
    [isGameOver, WORLD_WIDTH, WORLD_HEIGHT, PLAYER_SIZE, MOVE_SPEED]
  );

  // PERBAIKAN: Unified movement handler untuk keyboard dan WASD
  const startMovement = useCallback(
    (direction) => {
      if (isGameOver) return;

      // Start walking sound dengan interval 400ms (bisa disesuaikan)
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
    [isGameOver, handleArrowPress]
  );

  const stopMovement = useCallback(() => {
    setIsWalking(false);

    // Stop walking sound
    stopWalkingSound();

    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
  }, []);

  // PERBAIKAN: Keyboard handler yang simplified
  useEffect(() => {
    const keysPressed = new Set();

    const handleKeyDown = (e) => {
      if (isGameOver || keysPressed.has(e.key)) return;

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
        keysPressed.add(e.key);
        startMovement(direction);
      }
    };

    const handleKeyUp = (e) => {
      const walkKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "W", "a", "A", "s", "S", "d", "D"];
      if (walkKeys.includes(e.key)) {
        keysPressed.delete(e.key);

        // Stop hanya jika tidak ada key lain yang ditekan
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
  }, [isGameOver, startMovement, stopMovement]);

  // Rest of the component methods (handleBackToStart, handleItemUse, etc.) remain the same...
  const handleBackToStart = () => {
    if (isGameOver) return;
    navigate("/", {
      state: { characterName, playerName, stats: { ...playerStats, lastVisitedLocation } },
    });
  };

  const handleItemUse = (item) => {
    if (isGameOver) return;
    setUsedItems((prev) => new Set([...prev, item.name]));
    handleUseItem(item, setPlayerStats);
  };

  const handleLocationClick = (locationName) => {
    if (isGameOver) return;
    setVisitedLocations((prev) => new Set([...prev, locationName]));
    const routes = { home: "/home", beach: "/beach", field: "/field", mountain: "/mountain", restaurant: "/restaurant" };
    if (routes[locationName]) {
      navigate(routes[locationName], {
        state: { characterName, playerName, stats: { ...playerStats, lastVisitedLocation } },
      });
    }
  };

  const toggleTaskCompletion = (taskId) => {
    if (isGameOver) return;
    const taskLocation = lastVisitedLocation || "home";
    const taskKey = `${taskLocation}-${taskId}`;
    setPlayerStats((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskKey]: { ...(prev.tasks?.[taskKey] || {}), completed: !(prev.tasks?.[taskKey]?.completed || false) },
      },
    }));
  };

  const getPlaytime = () => Math.floor((Date.now() - gameStartTime) / 1000);

  const handleResetStats = () => {
    if (isGameOver) return;
    const defaultStats = { meal: 50, sleep: 50, health: 80, energy: 80, happiness: 50, cleanliness: 50, money: 100, experience: 0, level: 1, skillPoints: 0, items: [], tasks: {}, lastVisitedLocation: "home" };
    setPlayerStats(defaultStats);
    setVisitedLocations(new Set(["home"]));
    setUsedItems(new Set());
  };

  const handleMainMenu = () => {
    if (isGameOver) return;
    navigate("/");
  };

  // Updated camera centering logic using dynamic viewport size
  useEffect(() => {
    const cameraCenterX = playerPos.x - viewportSize.width / 2;
    const cameraCenterY = playerPos.y - viewportSize.height / 2;
    const clampedX = Math.max(0, Math.min(WORLD_WIDTH - viewportSize.width, cameraCenterX));
    const clampedY = Math.max(0, Math.min(WORLD_HEIGHT - viewportSize.height, cameraCenterY));
    setCameraPos({ x: clampedX, y: clampedY });
  }, [playerPos, viewportSize]);

  useEffect(() => {
    if (isGameOver) return;
    if (isNearHouse(playerPos.x, playerPos.y) || isNearField(playerPos.x, playerPos.y) || isNearBeach(playerPos.x, playerPos.y) || isNearResto(playerPos.x, playerPos.y) || isNearGunung(playerPos.x, playerPos.y)) {
      if (isNearHouse(playerPos.x, playerPos.y)) {
        setCurrentLocation("home");
        setLastVisitedLocation("home");
        setVisitedLocations((prev) => new Set([...prev, "home"]));
      }
      if (isNearField(playerPos.x, playerPos.y)) {
        setCurrentLocation("field");
        setLastVisitedLocation("field");
        setVisitedLocations((prev) => new Set([...prev, "field"]));
      }
      if (isNearBeach(playerPos.x, playerPos.y)) {
        setCurrentLocation("beach");
        setLastVisitedLocation("beach");
        setVisitedLocations((prev) => new Set([...prev, "beach"]));
      }
      if (isNearResto(playerPos.x, playerPos.y)) {
        setCurrentLocation("restaurant");
        setLastVisitedLocation("restaurant");
        setVisitedLocations((prev) => new Set([...prev, "restaurant"]));
      }
      if (isNearGunung(playerPos.x, playerPos.y)) {
        setCurrentLocation("mountain");
        setLastVisitedLocation("mountain");
        setVisitedLocations((prev) => new Set([...prev, "mountain"]));
      }
      setShowDialog(true);
    } else {
      setCurrentLocation("map");
      setShowDialog(false);
    }
  }, [playerPos, isGameOver]);

  const handleEnterLocation = () => {
    if (!currentLocation || currentLocation === "map" || isGameOver) return;
    const locationRoute = currentLocation === "home" ? "home" : currentLocation;
    navigate(`/${locationRoute}`, {
      state: { characterName, playerName, stats: { ...playerStats, lastVisitedLocation } },
    });
  };

  const toggleTaskPanel = () => {
    if (isGameOver) return;
    setShowTasks(!showTasks);
  };

  const togglePlayerInfo = () => {
    if (isGameOver || !shouldUseMinimizedBehavior()) return;
    setIsPlayerInfoExpanded(!isPlayerInfoExpanded);
  };

  useEffect(() => {
    if (playerStats.health <= 0 || playerStats.sleep <= 0) {
      setIsGameOver(true);
      setShowDialog(false);
    }
  }, [playerStats.health, playerStats.sleep]);

  return (
    <div className="game-container">
      {isGameOver && <GameOver playerStats={playerStats} tasks={playerStats.tasks || {}} visitedLocations={visitedLocations} usedItems={usedItems} playtime={getPlaytime()} characterName={characterName} playerName={playerName} isGameOver={true} />}

      {/* Task component with lowest z-index (below everything except map background) - hide when game over */}
      {!isGameOver && showTasks && <Task currentLocation={lastVisitedLocation || "home"} isInsideLocation={false} externalTasks={playerStats.tasks || {}} onTaskComplete={toggleTaskCompletion} />}

      {/* Stats and controls - hide when game over */}
      {!isGameOver && (
        <div>
          <StatsPlayer stats={playerStats} onStatsUpdate={setPlayerStats} onResetStats={handleResetStats} onUseItem={handleItemUse} visitedLocations={visitedLocations} usedItems={usedItems} playtime={getPlaytime()} onMainMenu={handleMainMenu} />
          <SpeedToggleButton />
          <BackTo type="start" onClick={handleBackToStart} />
        </div>
      )}

      {/* Location dialog - hide when game over */}
      {!isGameOver && showDialog && currentLocation && currentLocation !== "map" && (
        <div className="dialog fade-in-center">
          <p>{currentLocation === "home" ? "Do you want to go home?" : `Do you want to enter the ${capitalize(currentLocation)}?`}</p>
          <button className="yes-btn" onClick={handleEnterLocation}>
            Yes
          </button>
          <button className="no-btn" onClick={() => setShowDialog(false)}>
            No
          </button>
        </div>
      )}

      <div className="game-viewport" ref={mapRef}>
        {!isGameOver && <SpeedToggleButton />}
        <div
          className="game-world map-background"
          style={{
            transform: `translate(-${cameraPos.x}px, -${cameraPos.y}px)`,
            pointerEvents: isGameOver ? "none" : "auto",
          }}
        >
          {/* Main Map Location Pointers */}
          {mainMapLocationPointers.map((pointer) => (
            <div key={pointer.name} className="location-pointer" style={{ left: pointer.x, top: pointer.y, pointerEvents: isGameOver ? "none" : "auto" }} onClick={() => handleLocationClick(pointer.name)}>
              <img src={`/assets/icons/${pointer.name}_pin.png`} alt={`${pointer.label} pointer`} className="pointer-image" />
              <div className="pointer-label">{pointer.label}</div>
            </div>
          ))}

          <div className="player" ref={playerRef} style={{ left: playerPos.x, top: playerPos.y }}>
            {/* Tampilkan sprite idle atau GIF bergerak */}
            {isWalking ? (
              <Gif activity="jalan" location={currentLocation || "map"} isWalking={isWalking} characterName={characterName} walkingDirection={walkingDirection} />
            ) : (
              <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="player-sprite" draggable={false} />
            )}
          </div>
        </div>
      </div>

      {/* HUD elements - hide when game over */}
      {!isGameOver && (
        <div className="game-hud">
          <div className="mini-map">
            <div className="mini-map-world">
              {/* Mini-map Location Pointers */}
              {miniMapLocationPointers.map((pointer) => (
                <div
                  key={`mini-${pointer.name}`}
                  className="mini-map-pointer"
                  style={{
                    left: `${(pointer.x / WORLD_WIDTH) * 100}%`,
                    top: `${(pointer.y / WORLD_HEIGHT) * 100}%`,
                  }}
                >
                  <img src={`/assets/icons/${pointer.name}_pin.png`} alt={`${pointer.label} pointer`} className="mini-pointer-image" />
                </div>
              ))}
              <div
                className="mini-map-player"
                style={{
                  left: `${((playerPos.x + PLAYER_SIZE / 2) / WORLD_WIDTH) * 100}%`,
                  top: `${((playerPos.y + 50) / WORLD_HEIGHT) * 100}%`,
                }}
              />
              <div
                className="mini-map-viewport"
                style={{
                  left: `${(cameraPos.x / WORLD_WIDTH) * 100}%`,
                  top: `${(cameraPos.y / WORLD_HEIGHT) * 100}%`,
                  width: `${(viewportSize.width / WORLD_WIDTH) * 100}%`,
                  height: `${(viewportSize.height / WORLD_HEIGHT) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Updated player-info with conditional rendering and click handler */}
          <div className={`player-info ${shouldUseMinimizedBehavior() ? (isPlayerInfoExpanded ? "expanded" : "minimized") : ""}`} onClick={togglePlayerInfo}>
            <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="hud-avatar" />
            {(shouldUseMinimizedBehavior() ? isPlayerInfoExpanded : true) && (
              <div className="player-coords">
                {playerName.toUpperCase()} • X: {Math.floor(playerPos.x)} Y: {Math.floor(playerPos.y)}
              </div>
            )}
          </div>

          <div className="controls-hint">
            <div>🎮 Arrow Keys / WASD to move</div>
            <div>🗺️ Explore the village!</div>
          </div>
        </div>
      )}

      {/* WASD and Inventory - disable when game over */}
      {!isGameOver && (
        <>
          <WASDKey onStartMovement={startMovement} onStopMovement={stopMovement} isMapLocation={true} isWalking={isWalking} walkingDirection={walkingDirection} />
          {showInventory && <Inventory items={playerStats.items} onClose={() => setShowInventory(false)} onUseItem={handleItemUse} />}
        </>
      )}
    </div>
  );
}

export default Map;
