import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";
import "../house.css";

function Map() {
  const location = useLocation();
  const navigate = useNavigate();

  const { characterName = "claire", playerName = "Player" } = location.state || {};

  const [playerPos, setPlayerPos] = useState({ x: 2110, y: 730 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [showDialog, setShowDialog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  const mapRef = useRef(null);
  const playerRef = useRef(null);

  const WORLD_WIDTH = 3700;
  const WORLD_HEIGHT = 1954;
  const VIEWPORT_WIDTH = 800;
  const VIEWPORT_HEIGHT = 600;
  const PLAYER_SIZE = 40;
  const MOVE_SPEED = 8;

  const [playerStats, setPlayerStats] = useState({
    meal: 50,
    sleep: 50,
    happiness: 50,
    cleanliness: 50,
    money: 100,
    items: [],
  });

  // Handle camera movement
  useEffect(() => {
    const cameraCenterX = playerPos.x - VIEWPORT_WIDTH / 2;
    const cameraCenterY = playerPos.y - VIEWPORT_HEIGHT / 2;

    const clampedX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, cameraCenterX));
    const clampedY = Math.max(0, Math.min(WORLD_HEIGHT - VIEWPORT_HEIGHT, cameraCenterY));

    setCameraPos({ x: clampedX, y: clampedY });
  }, [playerPos]);

  // Handle player movement
  useEffect(() => {
    const handleKeyDown = (e) => {
      setPlayerPos((prev) => {
        let newX = prev.x;
        let newY = prev.y;

        switch (e.key) {
          case "ArrowUp":
          case "w":
          case "W":
            newY = Math.max(0, prev.y - MOVE_SPEED);
            break;
          case "ArrowDown":
          case "s":
          case "S":
            newY = Math.min(1745, prev.y + MOVE_SPEED);
            break;
          case "ArrowLeft":
          case "a":
          case "A":
            newX = Math.max(0, prev.x - MOVE_SPEED);
            break;
          case "ArrowRight":
          case "d":
          case "D":
            newX = Math.min(3575, prev.x + MOVE_SPEED);
            break;
          default:
            return prev;
        }

        return { x: newX, y: newY };
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    <div className="house-game-container">
      <div className="house-game-viewport" ref={mapRef}>
        <div className="house-game-world house-background" style={{ transform: `translate(-${cameraPos.x}px, -${cameraPos.y}px)` }}>
          <div className="house-player" ref={playerRef} style={{ left: playerPos.x, top: playerPos.y }}>
            <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="house-player-sprite" draggable={false} />
            <div />
          </div>
        </div>
      </div>

      <div className="house-game-hud">
        <div className="house-mini-map">
          <div className="house-mini-map-world">
            <div
              className="house-mini-map-player"
              style={{
                left: ((playerPos.x + PLAYER_SIZE / 2) / WORLD_WIDTH) * 100 + "%",
                top: ((playerPos.y + 60 / 2) / WORLD_HEIGHT) * 100 + "%",
              }}
            />
            <div
              className="house-mini-map-viewport"
              style={{
                left: (cameraPos.x / WORLD_WIDTH) * 100 + "%",
                top: (cameraPos.y / WORLD_HEIGHT) * 100 + "%",
                width: (VIEWPORT_WIDTH / WORLD_WIDTH) * 100 + "%",
                height: (VIEWPORT_HEIGHT / WORLD_HEIGHT) * 100 + "%",
              }}
            />
          </div>
        </div>

        <div className="house-player-info">
          <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="house-hud-avatar" />
          <div className="house-player-coords">
            {playerName.toUpperCase()} • X: {Math.floor(playerPos.x)} Y: {Math.floor(playerPos.y)}
          </div>
        </div>

        <div className="house-stats-container">
          <StatsPlayer stats={playerStats} />
        </div>

        <div className="house-controls-hint">
          <div>🎮 Arrow Keys / WASD to move</div>
          <div>🗺️ Explore the village!</div>
        </div>
      </div>
    </div>
  );
}

export default Map;
