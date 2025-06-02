import React, { useState } from "react";
import "../inventory.css";

function Inventory({ items = [], onClose }) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Rocks", "Flowers", "Marine", "Everyday"];

  // Get icon class based on item name - this is the key function for showing SVG icons
  const getIconClass = (item) => {
    switch (item.name) {
      case "Rose":
        return "item-icon-rose";
      case "Daisy":
        return "item-icon-daisy";
      case "Sunflower":
        return "item-icon-sunflower";
      case "Tulip":
        return "item-icon-tulip";
      case "Conch Shell":
        return "item-icon-conch-shell";
      case "Starfish":
        return "item-icon-starfish";
      case "Shiny Rock":
        return "item-icon-shiny-rock";
      case "Granite":
        return "item-icon-granite";
      case "Pencil":
        return "item-icon-pencil";
      default:
        return "item-icon-pencil"; // Default icon
    }
  };

  // Use actual items if provided, otherwise show empty inventory
  const displayItems = items.length > 0 ? items : [];

  const filteredItems = selectedCategory === "All" ? displayItems : displayItems.filter((item) => item.category === selectedCategory);

  // Create empty slots for the 5x5 grid
  const gridSlots = Array(25).fill(null);
  filteredItems.forEach((item, index) => {
    if (index < 25) gridSlots[index] = item;
  });

  console.log("Rendering inventory with items:", items);

  return (
    <div className="inventory-overlay">
      <div className="inventory-window">
        <div className="inventory-header">
          <h2 className="inventory-title">INVENTORY</h2>
          <button className="inventory-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="inventory-categories">
          {categories.map((category) => (
            <button key={category} className={`category-btn ${selectedCategory === category ? "active" : ""}`} onClick={() => setSelectedCategory(category)}>
              {category}
            </button>
          ))}
        </div>

        <div className="inventory-grid">
          {gridSlots.map((item, index) => (
            <div key={index} className={`inventory-slot ${item ? "filled" : "empty"}`}>
              {item && (
                <>
                  <div className={`item-icon ${getIconClass(item)}`}></div>
                  <div className="item-quantity">{item.quantity}</div>
                  <div className="item-tooltip">{item.name}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Inventory;
