import React from "react";

function StatsPlayer({ stats }) {
  const { meal = 50, sleep = 50, happiness = 50, cleanliness = 50, money = 0, items = [""] } = stats || {};

  return (
    <div className="stats-player">
      <h3>PLAYER STATUS</h3>

      <div className="stat-item meal">
        <span>Meal</span>
        <progress value={meal} max="100" />
        <span>{meal}%</span>
      </div>

      <div className="stat-item sleep">
        <span>Sleep</span>
        <progress value={sleep} max="100" />
        <span>{sleep}%</span>
      </div>

      <div className="stat-item happiness">
        <span>Mood</span>
        <progress value={happiness} max="100" />
        <span>{happiness}%</span>
      </div>

      <div className="stat-item cleanliness">
        <span>Clean</span>
        <progress value={cleanliness} max="100" />
        <span>{cleanliness}%</span>
      </div>

      <div className="stat-item money">
        <span>Money</span>
        <span className="money-value">${money}</span>
      </div>

      <div className="stat-item items">
        <span>Items</span>
        <ul className="items-list">{Array.isArray(items) && items.length > 0 ? items.map((item, index) => <li key={index}>{item}</li>) : <li>No items</li>}</ul>
      </div>
    </div>
  );
}

export default StatsPlayer;
