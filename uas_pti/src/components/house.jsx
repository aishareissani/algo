import React, { useEffect, useState, useRef, useCallback } from "react"; // Added useCallback
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";
import "../house.css";

function House() {
  const location = useLocation();
  const navigate = useNavigate();

  const { characterName = "claire", playerName = "Player" } = location.state || {};

  const [playerPos, setPlayerPos] = useState({ x: 2000, y: 1300 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(0.299); // Initial zoom
  const [actualViewportSize, setActualViewportSize] = useState({ width: 0, height: 0 });

  const houseRef = useRef(null);
  const playerRef = useRef(null);

  const WORLD_WIDTH = 3825;
  const WORLD_HEIGHT = 2008;
  const PLAYER_SIZE = 190;
  const PLAYER_SCALE = 1.5;
  const MOVE_SPEED = 25;

  const [playerStats, setPlayerStats] = useState({
    meal: 50,
    sleep: 50,
    happiness: 50,
    cleanliness: 50,
    money: 100,
    items: [],
  });

  // Get actual viewport size
  useEffect(() => {
    const updateViewportSize = () => {
      if (houseRef.current) {
        setActualViewportSize({
          width: houseRef.current.clientWidth,
          height: houseRef.current.clientHeight,
        });
      }
    };

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  const handleZoom = useCallback(
    (delta) => {
      setZoomLevel((prevZoom) => {
        let minZoomCalculated = 0.1; // Absolute minimum fallback

        if (actualViewportSize.width > 0 && WORLD_WIDTH > 0 && actualViewportSize.height > 0 && WORLD_HEIGHT > 0) {
          const minZoomX = actualViewportSize.width / WORLD_WIDTH;
          const minZoomY = actualViewportSize.height / WORLD_HEIGHT;
          // This minZoom ensures the scaled world at least covers the viewport dimension-wise
          minZoomCalculated = Math.max(minZoomX, minZoomY);
        }

        // Combine with an absolute floor, ensuring it's at least 0.1 AND covers viewport
        const minZoom = Math.max(0.1, minZoomCalculated);

        return Math.max(minZoom, Math.min(2, prevZoom + delta));
      });
    },
    [actualViewportSize.width, actualViewportSize.height, WORLD_WIDTH, WORLD_HEIGHT]
  ); // Dependencies for useCallback

  // Handle camera movement
  useEffect(() => {
    if (actualViewportSize.width === 0 || actualViewportSize.height === 0 || zoomLevel === 0) return;

    const scaledWorldWidth = WORLD_WIDTH * zoomLevel;
    const scaledWorldHeight = WORLD_HEIGHT * zoomLevel;

    const viewportWidthInWorld = actualViewportSize.width / zoomLevel;
    const viewportHeightInWorld = actualViewportSize.height / zoomLevel;

    let targetCameraX = playerPos.x - viewportWidthInWorld / 2;
    let targetCameraY = playerPos.y - viewportHeightInWorld / 2;

    if (scaledWorldWidth < actualViewportSize.width) {
      // Center the world horizontally if it's visually smaller than viewport
      targetCameraX = (WORLD_WIDTH - viewportWidthInWorld) / 2;
    } else {
      // Clamp camera to keep it within world bounds when scrolling
      targetCameraX = Math.max(0, Math.min(WORLD_WIDTH - viewportWidthInWorld, targetCameraX));
    }

    if (scaledWorldHeight < actualViewportSize.height) {
      // Center the world vertically if it's visually smaller than viewport
      targetCameraY = (WORLD_HEIGHT - viewportHeightInWorld) / 2;
    } else {
      // Clamp camera to keep it within world bounds when scrolling
      targetCameraY = Math.max(0, Math.min(WORLD_HEIGHT - viewportHeightInWorld, targetCameraY));
    }

    setCameraPos({ x: targetCameraX, y: targetCameraY });
  }, [playerPos, zoomLevel, actualViewportSize, WORLD_WIDTH, WORLD_HEIGHT]); // Added WORLD_WIDTH, WORLD_HEIGHT

  // Handle player movement
  useEffect(() => {
    const handleKeyDown = (e) => {
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
  }, [MOVE_SPEED, PLAYER_SCALE, PLAYER_SIZE, WORLD_HEIGHT, WORLD_WIDTH]); // Added dependencies

  // Handle zoom with mouse wheel
  useEffect(() => {
    const wheelHandler = (e) => {
      // Renamed to avoid conflicts if any
      if (e.ctrlKey) {
        // Check if the event target is within the houseRef viewport or houseRef itself
        if (houseRef.current && houseRef.current.contains(e.target)) {
          e.preventDefault();
          handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
        }
      }
    };
    window.addEventListener("wheel", wheelHandler, { passive: false });
    return () => window.removeEventListener("wheel", wheelHandler);
  }, [handleZoom]); // handleZoom is now memoized with useCallback

  return (
    <div className="house-game-container">
      <div className="house-game-viewport" ref={houseRef}>
        <div
          className="house-game-world house-background"
          style={{
            width: `${WORLD_WIDTH}px`,
            height: `${WORLD_HEIGHT}px`,
            // CRITICAL FIX HERE: Multiply cameraPos (world units) by zoomLevel for visual translation
            transform: `translate(-${cameraPos.x * zoomLevel}px, -${cameraPos.y * zoomLevel}px) scale(${zoomLevel})`,
            transformOrigin: "0 0",
          }}
        >
          <div
            className="house-player"
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
            <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="house-player-sprite" draggable={false} style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
      </div>

      <div className="house-game-hud">
        <div className="house-player-info">
          <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="house-hud-avatar" />
          <div className="house-player-coords">
            {playerName.toUpperCase()} • X: {Math.floor(playerPos.x)} Y: {Math.floor(playerPos.y)} • Z: {zoomLevel.toFixed(2)}
          </div>
        </div>
        <div className="house-stats-container">
          <StatsPlayer stats={playerStats} />
        </div>
        <div className="house-controls-hint">
          <div>🎮 Arrow Keys / WASD to move</div>
          <div>🖱️ Ctrl+Scroll on House to zoom</div>
        </div>
      </div>
    </div>
  );
}

export default House;
