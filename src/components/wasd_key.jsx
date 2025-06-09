import React, { useEffect, useRef } from "react";
import "../wasd_key.css";

const WASDKey = ({ onKeyPress, isMapLocation = false }) => {
  // Store interval IDs for each direction
  const intervals = useRef({});

  // Handle physical keyboard inputs
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const keyMap = {
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };

      if (keyMap[key]) {
        event.preventDefault();
        onKeyPress(keyMap[key]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onKeyPress]);

  // Start continuous move on mouse/touch down
  const handleStartPress = (direction) => {
    onKeyPress(direction);
    intervals.current[direction] = setInterval(() => {
      onKeyPress(direction);
    }, 30);
  };

  // Clear the timer when mouse/touch is released
  const handleEndPress = (direction) => {
    if (intervals.current[direction]) {
      clearInterval(intervals.current[direction]);
      intervals.current[direction] = null;
    }
  };

  // Generate class names based on isMapLocation prop
  const containerClass = `wasd-key-container${isMapLocation ? " map-location" : ""}`;
  const padClass = `wasd-key-pad${isMapLocation ? " map-location" : ""}`;
  const middleRowClass = `wasd-key-middle-row${isMapLocation ? " map-location" : ""}`;
  const keyClass = (key) => `wasd-key wasd-key-${key}${isMapLocation ? " map-location" : ""}`;

  return (
    <div className={containerClass}>
      <div className={padClass}>
        {/* Top row with just W */}
        <div className="wasd-key-top-row">
          <button
            className={keyClass("w")}
            aria-label="W key for up"
            onMouseDown={() => handleStartPress("up")}
            onMouseUp={() => handleEndPress("up")}
            onMouseLeave={() => handleEndPress("up")}
            onTouchStart={() => handleStartPress("up")}
            onTouchEnd={() => handleEndPress("up")}
          >
            W
          </button>
        </div>

        {/* Bottom row with A S D */}
        <div className={middleRowClass}>
          <button
            className={keyClass("a")}
            aria-label="A key for left"
            onMouseDown={() => handleStartPress("left")}
            onMouseUp={() => handleEndPress("left")}
            onMouseLeave={() => handleEndPress("left")}
            onTouchStart={() => handleStartPress("left")}
            onTouchEnd={() => handleEndPress("left")}
          >
            A
          </button>

          <button
            className={keyClass("s")}
            aria-label="S key for down"
            onMouseDown={() => handleStartPress("down")}
            onMouseUp={() => handleEndPress("down")}
            onMouseLeave={() => handleEndPress("down")}
            onTouchStart={() => handleStartPress("down")}
            onTouchEnd={() => handleEndPress("down")}
          >
            S
          </button>

          <button
            className={keyClass("d")}
            aria-label="D key for right"
            onMouseDown={() => handleStartPress("right")}
            onMouseUp={() => handleEndPress("right")}
            onMouseLeave={() => handleEndPress("right")}
            onTouchStart={() => handleStartPress("right")}
            onTouchEnd={() => handleEndPress("right")}
          >
            D
          </button>
        </div>
      </div>
    </div>
  );
};

export default WASDKey;
