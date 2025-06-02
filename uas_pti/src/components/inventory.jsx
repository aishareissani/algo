import React, { useState } from "react";
import "../inventory.css";

function Inventory({ items = [], onClose }) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Rocks", "Flowers", "Seashells", "Everyday"];

  // Sample items for demonstration - you can replace with actual items
  const sampleItems =
    items.length > 0
      ? items
      : [
          { id: 1, name: "Shiny Rock", category: "Rocks", icon: "🪨", quantity: 3 },
          { id: 2, name: "Rose", category: "Flowers", icon: "🌹", quantity: 5 },
          { id: 3, name: "Daisy", category: "Flowers", icon: "🌼", quantity: 2 },
          { id: 4, name: "Conch Shell", category: "Seashells", icon: "🐚", quantity: 1 },
          { id: 5, name: "Pencil", category: "Everyday", icon: "✏️", quantity: 10 },
          { id: 6, name: "Granite", category: "Rocks", icon: "🪨", quantity: 7 },
        ];

  const filteredItems = selectedCategory === "All" ? sampleItems : sampleItems.filter((item) => item.category === selectedCategory);

  // Create empty slots for the 5x5 grid
  const gridSlots = Array(25).fill(null);
  filteredItems.forEach((item, index) => {
    if (index < 25) gridSlots[index] = item;
  });

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
                  <div className="item-icon">{item.icon}</div>
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
