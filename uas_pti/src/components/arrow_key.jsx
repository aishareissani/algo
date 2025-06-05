// arrow_key.jsx
import React, { useEffect, useRef } from "react";
import "../arrow_key.css";

const ArrowKey = ({ onKeyPress }) => {
  // Store interval IDs for each direction
  const intervals = useRef({});

  // Handle physical keyboard inputs as before.
  useEffect(() => {
    const handleKeyDown = (event) => {
      const keyMap = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };

      if (keyMap[event.key]) {
        event.preventDefault();
        onKeyPress(keyMap[event.key]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onKeyPress]);

  // Start continuous move on mouse (or touch) down.
  const handleStartPress = (direction) => {
    onKeyPress(direction); // Immediately trigger one move
    intervals.current[direction] = setInterval(() => {
      onKeyPress(direction);
    }, 30); // Adjust interval timing (in ms) here.
  };

  // Clear the timer when mouse or touch is released.
  const handleEndPress = (direction) => {
    if (intervals.current[direction]) {
      clearInterval(intervals.current[direction]);
      intervals.current[direction] = null;
    }
  };

  return (
    <div className="arrow-key-container">
      <div className="arrow-key-pad">
        <button
          className="arrow-key arrow-key-up"
          aria-label="Up arrow"
          onMouseDown={() => handleStartPress("up")}
          onMouseUp={() => handleEndPress("up")}
          onMouseLeave={() => handleEndPress("up")}
          onTouchStart={() => handleStartPress("up")}
          onTouchEnd={() => handleEndPress("up")}
        >
          <div className="arrow-icon arrow-icon-up"></div>
        </button>

        <div className="arrow-key-middle-row">
          <button
            className="arrow-key arrow-key-left"
            aria-label="Left arrow"
            onMouseDown={() => handleStartPress("left")}
            onMouseUp={() => handleEndPress("left")}
            onMouseLeave={() => handleEndPress("left")}
            onTouchStart={() => handleStartPress("left")}
            onTouchEnd={() => handleEndPress("left")}
          >
            <div className="arrow-icon arrow-icon-left"></div>
          </button>

          <div className="arrow-key-center">
            <div className="center-dot"></div>
          </div>

          <button
            className="arrow-key arrow-key-right"
            aria-label="Right arrow"
            onMouseDown={() => handleStartPress("right")}
            onMouseUp={() => handleEndPress("right")}
            onMouseLeave={() => handleEndPress("right")}
            onTouchStart={() => handleStartPress("right")}
            onTouchEnd={() => handleEndPress("right")}
          >
            <div className="arrow-icon arrow-icon-right"></div>
          </button>
        </div>

        <button
          className="arrow-key arrow-key-down"
          aria-label="Down arrow"
          onMouseDown={() => handleStartPress("down")}
          onMouseUp={() => handleEndPress("down")}
          onMouseLeave={() => handleEndPress("down")}
          onTouchStart={() => handleStartPress("down")}
          onTouchEnd={() => handleEndPress("down")}
        >
          <div className="arrow-icon arrow-icon-down"></div>
        </button>
      </div>
    </div>
  );
};

export default ArrowKey;
