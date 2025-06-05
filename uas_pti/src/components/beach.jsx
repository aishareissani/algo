import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";
import { useSpeedMode, SpeedToggleButton } from "./speed";
import Inventory from "./inventory";
import { handleUseItem } from "../utils/itemHandlers";
import "../beach.css";

function Beach() {
  const { isFastForward } = useSpeedMode();
  const location = useLocation();
  const navigate = useNavigate();

  const { characterName = "claire", playerName = "Player", stats: initialStats = {} } = location.state || {};
  const [showDialog, setShowDialog] = useState(false);
  const [currentLocationbeach, setCurrentLocationbeach] = useState(null);
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
  };

  const [playerStats, setPlayerStats] = useState(() => {
    const stats = { ...defaultStats };

    if (initialStats) {
      Object.keys(stats).forEach((key) => {
        if (key !== "items") {
          if (initialStats[key] !== undefined && !isNaN(Number(initialStats[key]))) {
            stats[key] = Number(initialStats[key]);
          }
        }
      });

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
        stats: playerStats,
      },
    });
  };

  const handleItemUse = (item) => {
    handleUseItem(item, setPlayerStats);
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
    console.log(`Performing activity at ${currentLocationbeach}`);

    if (currentLocationbeach === "Swim") {
      performActivity("Swimming", {
        energy: -25,
        happiness: 40,
        health: 10,
        meal: -20,
      });
    } else if (currentLocationbeach === "Sunbath") {
      performActivity("Taking a Sunbath", {
        happiness: 30,
        energy: 10,
      });
    } else if (currentLocationbeach === "Sandcastle") {
      performActivity("Making a sand castle", {
        happiness: 50,
        energy: 20,
        meal: -5,
        cleanliness: -10,
      });
    } else if (currentLocationbeach === "Seashell") {
      performActivity(
        "Picking seashell",
        {
          happiness: 40,
          energy: -20,
          meal: -20,
        },
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
    return (x >= 1450 && x <= 1725 && y >= 1150 && y <= 1425) || (x >= 1450 && x <= 1725 && y >= 725 && y <= 925) || (x >= 675 && x <= 950 && y >= 725 && y <= 925) || (x >= 675 && x <= 950 && y >= 1150 && y <= 1425);
  };

  const isNearSandcastle = (x, y) => {
    return (x >= 1850 && x <= 1975 && y >= 1375 && y <= 1675) || (x >= 400 && x <= 550 && y >= 600 && y <= 675);
  };

  const isNearSeashell = (x, y) => {
    return (x >= 2100 && x <= 2200 && y >= 275 && y <= 500) || (x >= 1250 && x <= 1350 && y >= 750 && y <= 950);
  };

  const isNearFlower = (x, y) => {
    return (x >= 625 && x <= 925 && y >= 1740 && y <= 1865) || (x >= 825 && x <= 1275 && y >= 290 && y <= 465);
  };

  const isNearStarFish = (x, y) => {
    return (x >= 2000 && x <= 2125 && y >= 1625 && y <= 1825) || (x >= 1150 && x <= 1275 && y >= 1225 && y <= 1450) || (x >= 375 && x <= 475 && y >= 300 && y <= 475);
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

  useEffect(() => {
    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
    };
  }, []);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isPerformingActivity) return;

      setPlayerPos((prev) => {
        let newX = prev.x;
        let newY = prev.y;
        const playerHalfSize = (PLAYER_SIZE * PLAYER_SCALE) / 2;

        switch (e.key.toLowerCase()) {
          case "arrowup":
          case "w":
            newY = Math.max(playerHalfSize, prev.y - MOVE_SPEED);
            break;
          case "arrowdown":
          case "s":
            newY = Math.min(WORLD_HEIGHT - playerHalfSize, prev.y + MOVE_SPEED);
            break;
          case "arrowleft":
          case "a":
            newX = Math.max(playerHalfSize, prev.x - MOVE_SPEED);
            break;
          case "arrowright":
          case "d":
            newX = Math.min(WORLD_WIDTH - playerHalfSize, prev.x + MOVE_SPEED);
            break;
          default:
            return prev;
        }
        return { x: newX, y: newY };
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [MOVE_SPEED, PLAYER_SCALE, PLAYER_SIZE, WORLD_HEIGHT, WORLD_WIDTH, isPerformingActivity]);

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
  }, [playerPos, isPerformingActivity]);

  return (
    <div className="beach-game-container">
      <div>
        <StatsPlayer stats={playerStats} onStatsUpdate={setPlayerStats} onUseItem={handleItemUse} />
        <SpeedToggleButton />
      </div>
      <div className="beach-game-viewport" ref={beachRef}>
        <SpeedToggleButton />
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
            <button className="back-to-map-button-inline" onClick={handleBackToMap}>
              Back to Map
            </button>
          </div>
        </div>
        <div className="controls-hint">
          <div>🎮 Arrow Keys / WASD to move</div>
          <div>🗺️ Explore the beach!</div>
        </div>
      </div>

      {showInventory && <Inventory items={playerStats.items} onClose={() => setShowInventory(false)} onUseItem={handleItemUse} />}
    </div>
  );
}

export default Beach;
