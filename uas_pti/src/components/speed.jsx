import React, { useState, createContext, useContext } from "react";
import "../speed.css";

// Create a context to manage speed mode across components
const SpeedModeContext = createContext();

// Speed Mode Provider component
export function SpeedModeProvider({ children }) {
  const [isFastForward, setIsFastForward] = useState(false);

  const toggleSpeedMode = () => {
    setIsFastForward((prev) => !prev);
  };

  return <SpeedModeContext.Provider value={{ isFastForward, toggleSpeedMode }}>{children}</SpeedModeContext.Provider>;
}

// Hook to use the speed mode
export function useSpeedMode() {
  const context = useContext(SpeedModeContext);
  if (!context) {
    throw new Error("useSpeedMode must be used within a SpeedModeProvider");
  }
  return context;
}

// SVG icons for play and fast-forward
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const FastForwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
  </svg>
);

// Speed Toggle Button component
export function SpeedToggleButton() {
  const { isFastForward, toggleSpeedMode } = useSpeedMode();

  // Check if current screen size should use mini circular behavior
  const shouldUseMiniCircular = () => {
    return window.innerWidth <= 1024;
  };

  return (
    <button onClick={toggleSpeedMode} className={`speed-toggle-button ${isFastForward ? "fast-forward" : "normal"} ${shouldUseMiniCircular() ? "mini-circular" : ""}`}>
      {/* Desktop version - shows icon + text */}
      {!shouldUseMiniCircular() && (
        <>
          {isFastForward ? (
            <>
              <FastForwardIcon />
              <span>Fast Forward</span>
            </>
          ) : (
            <>
              <PlayIcon />
              <span>Normal Speed</span>
            </>
          )}
        </>
      )}

      {/* Mobile/Tablet version - shows only icon */}
      {shouldUseMiniCircular() && <>{isFastForward ? <FastForwardIcon /> : <PlayIcon />}</>}
    </button>
  );
}

export default { SpeedModeProvider, useSpeedMode, SpeedToggleButton };
