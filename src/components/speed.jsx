import React, { useState, useEffect, createContext, useContext } from "react";
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

// Speed Toggle Button component - Fixed version
export function SpeedToggleButton() {
  const { isFastForward, toggleSpeedMode } = useSpeedMode();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  // Add resize listener to properly update mobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle click with debugging
  const handleClick = (e) => {
    e.preventDefault();
    console.log("Speed toggle clicked");
    toggleSpeedMode();
  };

  return (
    <button onClick={handleClick} className={`speed-toggle-button ${isFastForward ? "fast-forward" : "normal"} ${isMobile ? "mini-circular" : ""}`} aria-label={isFastForward ? "Switch to normal speed" : "Switch to fast forward"}>
      {!isMobile ? (
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
      ) : (
        <>{isFastForward ? <FastForwardIcon /> : <PlayIcon />}</>
      )}
    </button>
  );
}

// Example of how to use the components in your app
export function SpeedControlApp() {
  return (
    <SpeedModeProvider>
      <div className="app">
        {/* Your app content */}
        <SpeedToggleButton />
      </div>
    </SpeedModeProvider>
  );
}

export default { SpeedModeProvider, useSpeedMode, SpeedToggleButton, SpeedControlApp };
