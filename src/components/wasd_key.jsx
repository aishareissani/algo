import React, { useEffect, useState } from "react";
import "../wasd_key.css";

const WASDKey = ({ onStartMovement, onStopMovement, isMapLocation = false, isWalking = false, walkingDirection = "down" }) => {
  const [pressedKey, setPressedKey] = useState(null);

  // Sinkronisasi dengan Map state
  useEffect(() => {
    if (isWalking) {
      setPressedKey(walkingDirection);
    } else {
      setPressedKey(null);
    }
  }, [isWalking, walkingDirection]);

  const handleStartPress = (direction) => {
    setPressedKey(direction);
    onStartMovement(direction);
  };

  const handleEndPress = () => {
    setPressedKey(null);
    onStopMovement();
  };

  const containerClass = `wasd-key-container${isMapLocation ? " map-location" : ""}`;
  const padClass = `wasd-key-pad${isMapLocation ? " map-location" : ""}`;
  const middleRowClass = `wasd-key-middle-row${isMapLocation ? " map-location" : ""}`;

  const keyClass = (key, direction) => {
    let baseClass = `wasd-key wasd-key-${key}${isMapLocation ? " map-location" : ""}`;
    if (pressedKey === direction) {
      baseClass += " active";
    }
    return baseClass;
  };

  return (
    <div className={containerClass}>
      <div className={padClass}>
        <div className="wasd-key-top-row">
          <button
            className={keyClass("w", "up")}
            aria-label="W key for up"
            onMouseDown={() => handleStartPress("up")}
            onMouseUp={handleEndPress}
            onMouseLeave={handleEndPress}
            onTouchStart={(e) => {
              e.preventDefault();
              handleStartPress("up");
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleEndPress();
            }}
            onTouchCancel={handleEndPress}
          >
            W
          </button>
        </div>
        <div className={middleRowClass}>
          <button
            className={keyClass("a", "left")}
            aria-label="A key for left"
            onMouseDown={() => handleStartPress("left")}
            onMouseUp={handleEndPress}
            onMouseLeave={handleEndPress}
            onTouchStart={(e) => {
              e.preventDefault();
              handleStartPress("left");
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleEndPress();
            }}
            onTouchCancel={handleEndPress}
          >
            A
          </button>
          <button
            className={keyClass("s", "down")}
            aria-label="S key for down"
            onMouseDown={() => handleStartPress("down")}
            onMouseUp={handleEndPress}
            onMouseLeave={handleEndPress}
            onTouchStart={(e) => {
              e.preventDefault();
              handleStartPress("down");
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleEndPress();
            }}
            onTouchCancel={handleEndPress}
          >
            S
          </button>
          <button
            className={keyClass("d", "right")}
            aria-label="D key for right"
            onMouseDown={() => handleStartPress("right")}
            onMouseUp={handleEndPress}
            onMouseLeave={handleEndPress}
            onTouchStart={(e) => {
              e.preventDefault();
              handleStartPress("right");
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleEndPress();
            }}
            onTouchCancel={handleEndPress}
          >
            D
          </button>
        </div>
      </div>
    </div>
  );
};

export default WASDKey;
