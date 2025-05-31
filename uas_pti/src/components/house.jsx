import React from "react";
import { useLocation } from "react-router-dom";

function House() {
  const location = useLocation();
  const { characterName, playerName, fromMap } = location.state || {};

  return (
    <div>
      <h1>Welcome to the Home!</h1>
      <p>
        {playerName} datang dari map: {fromMap}
      </p>
      <img src={`/assets/avatar/${characterName}.png`} alt={characterName} />
    </div>
  );
}

export default House;
