// map.jsx
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";

function Map() {
  const location = useLocation();
  const navigate = useNavigate();

  const { characterName = "claire", playerName = "Player" } = location.state || {};

  const [playerPos, setPlayerPos] = useState({ x: 2110, y: 730 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [showDialog, setShowDialog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

  const mapRef = useRef(null);
  const playerRef = useRef(null);

  const WORLD_WIDTH = 3700;
  const WORLD_HEIGHT = 1954;
  const VIEWPORT_WIDTH = 800;
  const VIEWPORT_HEIGHT = 600;
  const PLAYER_SIZE = 40;
  const MOVE_SPEED = 8;

  const isNearHouseDoor = (x, y) => {
    return x >= 1918 && x <= 2262 && y >= 430 && y <= 660;
  };
  const isNearField = (x, y) => {
    return x >= 2894 && x <= 3160 && y >= 762 && y <= 1026;
  };
  const isNearBeach = (x, y) => {
    return x >= 3238 && x <= 3575 && y >= 626 && y <= 1186;
  };
  const isNearResto = (x, y) => {
    return x >= 1526 && x <= 1718 && y >= 898 && y <= 1058;
  };
  const isNearGunung = (x, y) => {
    return x >= 176 && x <= 848 && y >= 40 && y <= 1034;
  };

  const [playerStats, setPlayerStats] = useState({
    meal: 50,
    sleep: 50,
    happiness: 50,
    cleanliness: 50,
    money: 100,
    items: [],
  });

  useEffect(() => {
    if (isNearHouseDoor(playerPos.x, playerPos.y)) {
      setCurrentLocation("house");
      setShowDialog(true);
    } else if (isNearField(playerPos.x, playerPos.y)) {
      setCurrentLocation("field");
      setShowDialog(true);
    } else if (isNearBeach(playerPos.x, playerPos.y)) {
      setCurrentLocation("beach");
      setShowDialog(true);
    } else if (isNearResto(playerPos.x, playerPos.y)) {
      setCurrentLocation("restaurant");
      setShowDialog(true);
    } else if (isNearGunung(playerPos.x, playerPos.y)) {
      setCurrentLocation("mountain");
      setShowDialog(true);
    } else {
      setCurrentLocation(null);
      setShowDialog(false);
    }
  }, [playerPos]);

  useEffect(() => {
    const cameraCenterX = playerPos.x - VIEWPORT_WIDTH / 2;
    const cameraCenterY = playerPos.y - VIEWPORT_HEIGHT / 2;

    const clampedX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, cameraCenterX));
    const clampedY = Math.max(0, Math.min(WORLD_HEIGHT - VIEWPORT_HEIGHT, cameraCenterY));

    setCameraPos({ x: clampedX, y: clampedY });
  }, [playerPos]);

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

  useEffect(() => {
    if (
      // house
      (playerPos.x >= 1918 && playerPos.x <= 2262 && playerPos.y >= 430 && playerPos.y <= 660) ||
      // field
      (playerPos.x >= 2894 && playerPos.x <= 3160 && playerPos.y >= 762 && playerPos.y <= 1026) ||
      // beach
      (playerPos.x >= 3238 && playerPos.x <= 3575 && playerPos.y >= 626 && playerPos.y <= 1186) ||
      // resto
      (playerPos.x >= 1526 && playerPos.x <= 1718 && playerPos.y >= 898 && playerPos.y <= 1058) ||
      // gunung
      (playerPos.x >= 176 && playerPos.x <= 848 && playerPos.y >= 40 && playerPos.y <= 1034)
    ) {
      setShowDialog(true);
    } else {
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

      <div className="game-viewport" ref={mapRef}>
        <div className="game-world map-background" style={{ transform: "translate(-" + cameraPos.x + "px, -" + cameraPos.y + "px)" }}>
          <div className="player" ref={playerRef} style={{ left: playerPos.x, top: playerPos.y }}>
            <img src={"/assets/avatar/" + characterName + ".png"} alt={characterName} className="player-sprite" draggable={false} />
            <div />
          </div>
        </div>
      </div>

      <div className="game-hud">
        <div className="mini-map">
          <div className="mini-map-world">
            <div
              className="mini-map-player"
              style={{
                left: ((playerPos.x + PLAYER_SIZE / 2) / WORLD_WIDTH) * 100 + "%",
                top: ((playerPos.y + 60 / 2) / WORLD_HEIGHT) * 100 + "%",
              }}
            />

            <div
              className="mini-map-viewport"
              style={{
                left: (cameraPos.x / WORLD_WIDTH) * 100 + "%",
                top: (cameraPos.y / WORLD_HEIGHT) * 100 + "%",
                width: (VIEWPORT_WIDTH / WORLD_WIDTH) * 100 + "%",
                height: (VIEWPORT_HEIGHT / WORLD_HEIGHT) * 100 + "%",
              }}
            />
          </div>
        </div>

        <div className="player-info">
          <img src={"/assets/avatar/" + characterName + ".png"} alt={characterName} className="hud-avatar" />
          <div className="player-coords">
            {playerName.toUpperCase()} • X: {Math.floor(playerPos.x)} Y: {Math.floor(playerPos.y)}
          </div>
        </div>

        <div className="stats-container">
          <StatsPlayer stats={playerStats} />
        </div>

        <div className="controls-hint">
          <div>🎮 Arrow Keys / WASD to move</div>
          <div>🗺️ Explore the village!</div>
        </div>
      </div>
    </div>
  );
}

export default Map;
