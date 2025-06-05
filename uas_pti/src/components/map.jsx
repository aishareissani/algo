// src/components/map.jsx
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";
import Inventory from "./inventory";
import { handleUseItem } from "../utils/itemHandlers";
import ArrowKey from "./arrow_key";

function Map() {
  const location = useLocation();
  const navigate = useNavigate();

  const { characterName = "claire", playerName = "Player", stats: passedStats } = location.state || {};

  const [playerPos, setPlayerPos] = useState({ x: 2110, y: 730 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [showDialog, setShowDialog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showInventory, setShowInventory] = useState(false);

  const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

  const mapRef = useRef(null);
  const playerRef = useRef(null);

  const WORLD_WIDTH = 3700;
  const WORLD_HEIGHT = 1954;
  const VIEWPORT_WIDTH = 800;
  const VIEWPORT_HEIGHT = 600;
  const PLAYER_SIZE = 40;
  const MOVE_SPEED = 8;

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
    }
  );

  const handleBackToStart = () => {
    navigate("/", {
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

  // Unified Movement Handler
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

  // Keyboard Event Listener
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

  // Camera Position Update
  useEffect(() => {
    const cameraCenterX = playerPos.x - VIEWPORT_WIDTH / 2;
    const cameraCenterY = playerPos.y - VIEWPORT_HEIGHT / 2;

    const clampedX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, cameraCenterX));
    const clampedY = Math.max(0, Math.min(WORLD_HEIGHT - VIEWPORT_HEIGHT, cameraCenterY));

    setCameraPos({ x: clampedX, y: clampedY });
  }, [playerPos]);

  // Location Detection Dialog
  useEffect(() => {
    if (isNearHouse(playerPos.x, playerPos.y) || isNearField(playerPos.x, playerPos.y) || isNearBeach(playerPos.x, playerPos.y) || isNearResto(playerPos.x, playerPos.y) || isNearGunung(playerPos.x, playerPos.y)) {
      if (isNearHouse(playerPos.x, playerPos.y)) setCurrentLocation("house");
      if (isNearField(playerPos.x, playerPos.y)) setCurrentLocation("field");
      if (isNearBeach(playerPos.x, playerPos.y)) setCurrentLocation("beach");
      if (isNearResto(playerPos.x, playerPos.y)) setCurrentLocation("restaurant");
      if (isNearGunung(playerPos.x, playerPos.y)) setCurrentLocation("mountain");
      setShowDialog(true);
    } else {
      setCurrentLocation(null);
      setShowDialog(false);
    }
  }, [playerPos]);

  const handleEnterLocation = () => {
    if (!currentLocation) return;

    navigate(`/${currentLocation}`, {
      state: {
        characterName,
        playerName,
        stats: playerStats,
      },
    });
  };

  return (
    <div className="game-container">
      {/* Stats Player */}
      <div>
        <StatsPlayer stats={playerStats} onStatsUpdate={setPlayerStats} onUseItem={handleItemUse} />
      </div>

      {/* Interaction Dialog */}
      {showDialog && currentLocation && (
        <div className="dialog fade-in-center">
          <p>
            Do you want
            <br />
            to enter
            <br />
            the {capitalize(currentLocation)}?
          </p>
          <button className="yes-btn" onClick={handleEnterLocation}>
            Yes
          </button>
          <button className="no-btn" onClick={() => setShowDialog(false)}>
            No
          </button>
        </div>
      )}

      {/* Game Viewport */}
      <div className="game-viewport" ref={mapRef}>
        <div className="game-world map-background" style={{ transform: `translate(-${cameraPos.x}px, -${cameraPos.y}px)` }}>
          <div className="player" ref={playerRef} style={{ left: playerPos.x, top: playerPos.y }}>
            <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="player-sprite" draggable={false} />
            <div />
          </div>
        </div>
      </div>

      {/* Game HUD */}
      <div className="game-hud">
        {/* Mini Map */}
        <div className="mini-map">
          <div className="mini-map-world">
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

        {/* Player Info */}
        <div className="player-info">
          <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="hud-avatar" />
          <div className="player-coords">
            {playerName.toUpperCase()} • X: {Math.floor(playerPos.x)} Y: {Math.floor(playerPos.y)}
            <button className="back-to-start-button-inline" onClick={handleBackToStart}>
              Back to Start
            </button>
          </div>
        </div>

        {/* Controls Hint */}
        <div className="controls-hint">
          <div>🎮 Arrow Keys / WASD to move</div>
          <div>🗺️ Explore the village!</div>
        </div>
      </div>

      {/* Inventory */}
      {showInventory && <Inventory items={playerStats.items} onClose={() => setShowInventory(false)} onUseItem={handleItemUse} />}

      {/* On-screen Arrow Keys */}
      <ArrowKey onKeyPress={handleArrowPress} />
    </div>
  );
}

export default Map;
