import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";
import Inventory from "./inventory";
import { useSpeedMode, SpeedToggleButton } from "./speed";
import { handleUseItem } from "../utils/itemHandlers";
import WASDKey from "./wasd_key";
import Task from "./task";

function Map() {
  const { isFastForward } = useSpeedMode();
  const location = useLocation();
  const navigate = useNavigate();

  const { characterName = "claire", playerName = "Player", stats: passedStats } = location.state || {};

  const [playerPos, setPlayerPos] = useState({ x: 2110, y: 730 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [showDialog, setShowDialog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showTasks, setShowTasks] = useState(true);

  // Add tracking for GameOver data
  const [visitedLocations, setVisitedLocations] = useState(new Set(["home"]));
  const [usedItems, setUsedItems] = useState(new Set());
  const [gameStartTime] = useState(Date.now());

  const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

  const mapRef = useRef(null);
  const playerRef = useRef(null);

  const WORLD_WIDTH = 3700;
  const WORLD_HEIGHT = 1954;
  const VIEWPORT_WIDTH = 800;
  const VIEWPORT_HEIGHT = 600;
  const PLAYER_SIZE = 40;
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

  const handleBackToStart = () => {
    navigate("/", {
      state: {
        characterName,
        playerName,
        stats: {
          ...playerStats,
          lastVisitedLocation,
        },
      },
    });
  };

  const handleItemUse = (item) => {
    // Track used items
    setUsedItems((prev) => new Set([...prev, item.name]));
    handleUseItem(item, setPlayerStats);
  };

  const handleLocationClick = (locationName) => {
    // Track visited locations
    setVisitedLocations((prev) => new Set([...prev, locationName]));

    const routes = {
      home: "/home",
      beach: "/beach",
      field: "/field",
      mountain: "/mountain",
      restaurant: "/restaurant",
    };

    if (routes[locationName]) {
      navigate(routes[locationName], {
        state: {
          characterName,
          playerName,
          stats: {
            ...playerStats,
            lastVisitedLocation,
          },
        },
      });
    }
  };

  const toggleTaskCompletion = (taskId) => {
    const taskLocation = lastVisitedLocation || "home";
    const taskKey = `${taskLocation}-${taskId}`;

    setPlayerStats((prev) => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskKey]: {
          ...(prev.tasks?.[taskKey] || {}),
          completed: !(prev.tasks?.[taskKey]?.completed || false),
        },
      },
    }));
  };

  // Calculate playtime
  const getPlaytime = () => {
    return Math.floor((Date.now() - gameStartTime) / 1000);
  };

  // Reset stats function for new game
  const handleResetStats = () => {
    const defaultStats = {
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
    };
    setPlayerStats(defaultStats);
    setVisitedLocations(new Set(["home"]));
    setUsedItems(new Set());
  };

  const handleMainMenu = () => {
    navigate("/");
  };

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
  }, []);

  useEffect(() => {
    const cameraCenterX = playerPos.x - VIEWPORT_WIDTH / 2;
    const cameraCenterY = playerPos.y - VIEWPORT_HEIGHT / 2;

    const clampedX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, cameraCenterX));
    const clampedY = Math.max(0, Math.min(WORLD_HEIGHT - VIEWPORT_HEIGHT, cameraCenterY));

    setCameraPos({ x: clampedX, y: clampedY });
  }, [playerPos]);

  useEffect(() => {
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
  }, [playerPos]);

  const handleEnterLocation = () => {
    if (!currentLocation || currentLocation === "map") return;

    const locationRoute = currentLocation === "home" ? "home" : currentLocation;

    navigate(`/${locationRoute}`, {
      state: {
        characterName,
        playerName,
        stats: {
          ...playerStats,
          lastVisitedLocation,
        },
      },
    });
  };

  const toggleTaskPanel = () => setShowTasks(!showTasks);

  return (
    <div className="game-container">
      {/* Task component with lowest z-index (below everything except map background) */}
      {showTasks && <Task currentLocation={lastVisitedLocation || "home"} isInsideLocation={false} externalTasks={playerStats.tasks || {}} onTaskComplete={toggleTaskCompletion} />}

      <div>
        <StatsPlayer stats={playerStats} onStatsUpdate={setPlayerStats} onResetStats={handleResetStats} onUseItem={handleItemUse} visitedLocations={visitedLocations} usedItems={usedItems} playtime={getPlaytime()} onMainMenu={handleMainMenu} />
        <SpeedToggleButton />
      </div>

      {showDialog && currentLocation && currentLocation !== "map" && (
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
        <SpeedToggleButton />
        <div className="game-world map-background" style={{ transform: `translate(-${cameraPos.x}px, -${cameraPos.y}px)` }}>
          {/* Main Map Location Pointers */}
          {mainMapLocationPointers.map((pointer) => (
            <div
              key={pointer.name}
              className="location-pointer"
              style={{
                left: pointer.x,
                top: pointer.y,
              }}
              onClick={() => handleLocationClick(pointer.name)}
            >
              <img src={`/assets/icons/${pointer.name}_pin.png`} alt={`${pointer.label} pointer`} className="pointer-image" />
              <div className="pointer-label">{pointer.label}</div>
            </div>
          ))}

          <div className="player" ref={playerRef} style={{ left: playerPos.x, top: playerPos.y }}>
            <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="player-sprite" draggable={false} />
            <div />
          </div>
        </div>
      </div>

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
                top: `${((playerPos.y + PLAYER_SIZE / 2) / WORLD_HEIGHT) * 100}%`,
              }}
            />
            <div
              className="mini-map-viewport"
              style={{
                left: `${(cameraPos.x / WORLD_WIDTH) * 100}%`,
                top: `${(cameraPos.y / WORLD_HEIGHT) * 100}%`,
                width: `${(VIEWPORT_WIDTH / WORLD_WIDTH) * 100}%`,
                height: `${(VIEWPORT_HEIGHT / WORLD_HEIGHT) * 100}%`,
              }}
            />
          </div>
        </div>
        <div className="player-info">
          <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="hud-avatar" />
          <div className="player-coords">
            {playerName.toUpperCase()} • X: {Math.floor(playerPos.x)} Y: {Math.floor(playerPos.y)}
            <button className="back-to-start-button-inline" onClick={handleBackToStart}>
              Back to Start
            </button>
          </div>
        </div>
        <div className="controls-hint">
          <div>🎮 Arrow Keys / WASD to move</div>
          <div>🗺️ Explore the village!</div>
        </div>
      </div>

      <WASDKey onKeyPress={handleArrowPress} isMapLocation={true} />
      {showInventory && <Inventory items={playerStats.items} onClose={() => setShowInventory(false)} onUseItem={handleItemUse} />}
    </div>
  );
}

export default Map;
