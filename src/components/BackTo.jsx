// backTo.jsx
import React from "react";
import "../backTo.css";

const BackTo = ({
  type = "map", // "start", "home", or "map"
  onClick,
  className = "",
}) => {
  console.log("BackTo component rendered with type:", type);

  const getButtonConfig = () => {
    switch (type) {
      case "start":
        return {
          text: "START",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 13h3v7z" />
            </svg>
          ),
          cssClass: "start",
        };
      case "home":
        return {
          text: "HOME",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 13h3v7z" />
            </svg>
          ),
          cssClass: "home",
        };
      case "map":
      default:
        return {
          text: "MAP",
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          ),
          cssClass: "map",
        };
    }
  };

  const config = getButtonConfig();

  return (
    <button
      className={`back-to-toggle-button back-to-${config.cssClass} ${className}`}
      onClick={onClick}
      // For debugging, you can temporarily add inline style (remove or modify afterward)
      style={{ backgroundColor: "red", color: "white" }}
    >
      {config.icon}
      <span className="back-to-text">{config.text}</span>
    </button>
  );
};

export default BackTo;
