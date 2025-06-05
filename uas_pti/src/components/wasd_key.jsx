import React, { useEffect, useRef } from "react";
import "../wasd_key.css";

const WASDKey = ({ onKeyPress }) => {
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

  return (
    <div className="wasd-key-container">
      <div className="wasd-key-pad">
        {/* Top row with just W */}
        <div className="wasd-key-top-row">
          <button
            className="wasd-key wasd-key-w"
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
        <div className="wasd-key-middle-row">
          <button
            className="wasd-key wasd-key-a"
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
            className="wasd-key wasd-key-s"
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
            className="wasd-key wasd-key-d"
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
