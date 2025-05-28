import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles.css";

function Map() {
  const location = useLocation();
  const navigate = useNavigate();

  const { characterName = "claire", playerName = "Player" } = location.state || {};

  const [playerPos, setPlayerPos] = useState({ x: 2110, y: 730 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [showDialog, setShowDialog] = useState(false);

  const mapRef = useRef(null);
  const playerRef = useRef(null);

  const WORLD_WIDTH = 3700;
  const WORLD_HEIGHT = 1954;
  const VIEWPORT_WIDTH = 800;
  const VIEWPORT_HEIGHT = 600;
  const PLAYER_SIZE = 40;
  const MOVE_SPEED = 8;

  const isNearHouseDoor = (x, y) => {
    return x >= 2075 && x <= 2115 && y >= 625 && y <= 660;
  };

  useEffect(() => {
    if (isNearHouseDoor(playerPos.x, playerPos.y)) {
      setShowDialog(true);
    } else {
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
    if (playerPos.x >= 1910 && playerPos.x <= 2262 && playerPos.y >= 410 && playerPos.y <= 642) {
      setShowDialog(true);
    } else {
      setShowDialog(false);
    }
  }, [playerPos]);

  const handleEnterHome = () => {
    navigate("/home", { state: { characterName, playerName } });
  };

  return (
    <div className="game-container">
      {showDialog && (
        <div className="dialog">
          <p>
            Apakah anda
            <br />
            ingin masuk ke
            <br />
            rumah?
          </p>
          <button className="yes-btn" onClick={handleEnterHome}>
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

        <div className="controls-hint">
          <div>🎮 Arrow Keys / WASD to move</div>
          <div>🗺️ Explore the village!</div>
        </div>
      </div>
    </div>
  );
}

export default Map;
