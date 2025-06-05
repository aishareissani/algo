// field.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";
import { useSpeedMode, SpeedToggleButton } from "./speed";
import "../field.css";
import ArrowKey from "./arrow_key";

function Field() {
  const { isFastForward } = useSpeedMode();
  const location = useLocation();
  const navigate = useNavigate();

  const { characterName = "claire", playerName = "Player", stats: initialStats = {} } = location.state || {};
  const [showDialog, setShowDialog] = useState(false);
  const [currentLocationfield, setCurrentLocationfield] = useState(null);
  const [isPerformingActivity, setIsPerformingActivity] = useState(false);
  const [activityProgress, setActivityProgress] = useState(0);
  const [currentActivity, setCurrentActivity] = useState("");

  const [playerPos, setPlayerPos] = useState({ x: 2000, y: 1300 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(0.299);
  const [actualViewportSize, setActualViewportSize] = useState({ width: 0, height: 0 });

  const fieldRef = useRef(null);
  const playerRef = useRef(null);
  const activityIntervalRef = useRef(null);

  const WORLD_WIDTH = 3825;
  const WORLD_HEIGHT = 2008;
  const PLAYER_SIZE = 190;
  const PLAYER_SCALE = 1.5;
  const MOVE_SPEED = 25;
  const ACTIVITY_DURATION = 10000;
  const ACTIVITY_UPDATE_INTERVAL = 1000;

  // Initialize with stats from map or default values
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
    // Handle potentially corrupt stats data
    const stats = { ...defaultStats };

    if (initialStats) {
      // Ensure all numeric values are actually numbers
      Object.keys(stats).forEach((key) => {
        if (key !== "items") {
          // Make sure the value exists and is a valid number
          if (initialStats[key] !== undefined && !isNaN(Number(initialStats[key]))) {
            stats[key] = Number(initialStats[key]);
          }
        }
      });

      // Handle items array separately
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
        stats: playerStats, // Pass current stats back to map
      },
    });
  };

  const performActivity = (activityName, statChanges) => {
    if (isPerformingActivity) return;

    setIsPerformingActivity(true);
    setCurrentActivity(activityName);
    setActivityProgress(0);
    setShowDialog(false);
    if (isFastForward) {
      // Fast Forward mode: apply all changes instantly
      setPlayerStats((prev) => {
        const newStats = { ...prev };
        Object.keys(statChanges).forEach((stat) => {
          // Ensure changes are numeric
          const change = Number(statChanges[stat]);
          if (isNaN(change)) return; // Skip if not a valid number

          if (stat === "money" || stat === "experience" || stat === "skillPoints") {
            // Ensure the previous value is a number
            const prevValue = Number(prev[stat]) || 0;
            newStats[stat] = Math.max(0, prevValue + change);
          } else {
            // Ensure the previous value is a number
            const prevValue = Number(prev[stat]) || 0;
            newStats[stat] = Math.min(100, Math.max(0, prevValue + change));
          }
        });
        return newStats;
      });

      // Show a brief flash of activity
      setTimeout(() => {
        setActivityProgress(100);

        // End activity after a brief moment
        setTimeout(() => {
          setIsPerformingActivity(false);
          setCurrentActivity("");
          setActivityProgress(0);
        }, 500);
      }, 300);
    } else {
      const totalSteps = ACTIVITY_DURATION / ACTIVITY_UPDATE_INTERVAL;
      let currentStep = 0;

      // Calculate incremental changes per step
      const incrementalChanges = {};
      Object.keys(statChanges).forEach((stat) => {
        // Ensure changes are numeric
        const change = Number(statChanges[stat]);
        if (isNaN(change)) return; // Skip if not a valid number

        incrementalChanges[stat] = change / totalSteps;
      });

      activityIntervalRef.current = setInterval(() => {
        currentStep++;
        const progress = (currentStep / totalSteps) * 100;
        setActivityProgress(progress);

        // Update stats gradually
        setPlayerStats((prev) => {
          const newStats = { ...prev };

          Object.keys(incrementalChanges).forEach((stat) => {
            // Ensure the increment is numeric
            const increment = Number(incrementalChanges[stat]);
            if (isNaN(increment)) return; // Skip if not a valid number

            if (stat === "money" || stat === "experience" || stat === "skillPoints") {
              // Ensure the previous value is a number
              const prevValue = Number(prev[stat]) || 0;
              newStats[stat] = Math.max(0, prevValue + increment);
            } else {
              // Ensure the previous value is a number
              const prevValue = Number(prev[stat]) || 0;
              newStats[stat] = Math.min(100, Math.max(0, prevValue + increment));
            }
          });

          return newStats;
        });

        if (currentStep >= totalSteps) {
          // Activity completed
          clearInterval(activityIntervalRef.current);
          setIsPerformingActivity(false);
          setActivityProgress(0);
          setCurrentActivity("");
        }
      }, ACTIVITY_UPDATE_INTERVAL);
    }
  };

  const handleEnterLocation = () => {
    console.log(`Performing activity at ${currentLocationfield}`);

    if (currentLocationfield === "Swing") {
      performActivity("Swinging", {
        sleep: -30,
        energy: -25,
        health: 20,
        happiness: 40,
      });
    } else if (currentLocationfield === "Picnic") {
      performActivity("Taking a Picnic", {
        happiness: 30,
        meal: 50,
      });
    } else if (currentLocationfield === "Chair") {
      performActivity("Sit", {
        happiness: 20,
        energy: 20,
      });
    } else if (currentLocationfield === "Fountain") {
      performActivity("Making a wish", {
        happiness: 40,
        money: -5,
      });
    }
  };

  // Clean up activity interval on unmount
  useEffect(() => {
    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
    };
  }, []);

  const isNearSwing = (x, y) => {
    return x >= 2450 && x <= 2825 && y >= 142 && y <= 475;
  };

  const isNearPicnic = (x, y) => {
    return x >= 750 && x <= 1150 && y >= 975 && y <= 1575;
  };

  const isNearChair = (x, y) => {
    return x >= 725 && x <= 1075 && y >= 200 && y <= 450;
  };

  const isNearFountain = (x, y) => {
    return x >= 1750 && x <= 2175 && y >= 700 && y <= 1175;
  };

  const dialogMessages = {
    Swing: "Do you want to use the swing?",
    Picnic: "Do you want to have a picnic?",
    Chair: "Do you want to sit on the chair?",
    Fountain: "Do you want to throw a coin and make a wish?",
  };

  const renderDialogMessage = (message) => {
    return message.split("\n").map((line, idx) => <p key={idx}>{line}</p>);
  };

  // Get actual viewport size
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
    if (isPerformingActivity) return; // Don't show dialogs during activities

    if (isNearSwing(playerPos.x, playerPos.y)) {
      setCurrentLocationfield("Swing");
      setShowDialog(true);
    } else if (isNearPicnic(playerPos.x, playerPos.y)) {
      setCurrentLocationfield("Picnic");
      setShowDialog(true);
    } else if (isNearChair(playerPos.x, playerPos.y)) {
      setCurrentLocationfield("Chair");
      setShowDialog(true);
    } else if (isNearFountain(playerPos.x, playerPos.y)) {
      setCurrentLocationfield("Fountain");
      setShowDialog(true);
    } else {
      // IMPORTANT: Clear dialog when not near any location
      setCurrentLocationfield(null);
      setShowDialog(false);
    }
  }, [playerPos, isPerformingActivity]);

  return (
    <div className="field-game-container">
      <div>
        <StatsPlayer stats={playerStats} onStatsUpdate={setPlayerStats} />
        <SpeedToggleButton />
      </div>
      <div className="field-game-viewport" ref={fieldRef}>
        {showDialog && currentLocationfield && !isPerformingActivity && (
          <div className="dialog fade-in-center">
            {renderDialogMessage(dialogMessages[currentLocationfield] || `Do you want to enter the ${currentLocationfield}?`)}
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
          className="field-game-world field-background"
          style={{
            width: `${WORLD_WIDTH}px`,
            height: `${WORLD_HEIGHT}px`,
            transform: `translate(-${cameraPos.x * zoomLevel}px, -${cameraPos.y * zoomLevel}px) scale(${zoomLevel})`,
            transformOrigin: "0 0",
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
            <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="field-player-sprite" draggable={false} style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
      </div>

      <div className="game-hud">
        <div className="player-info">
          <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="hud-avatar" />
          <div className="player-coords">
            {playerName.toUpperCase()} • X: {Math.floor(playerPos.x)} Y: {Math.floor(playerPos.y)}
            {/* Back to Map Button positioned directly below coordinates */}
            <button className="back-to-map-button-inline" onClick={handleBackToMap}>
              Back to Map
            </button>
          </div>
        </div>
        <div className="controls-hint">
          <div>🎮 Arrow Keys / WASD to move</div>
          <div>🗺️ Explore the field!</div>
        </div>
      </div>
      <ArrowKey onKeyPress={handleArrowPress} />
    </div>
  );
}

export default Field;
