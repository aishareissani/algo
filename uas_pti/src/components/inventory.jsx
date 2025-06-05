import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "../inventory.css";

const categories = ["All", "Rocks", "Flowers", "Marine", "Daily"];

function Inventory({ items = [], onClose, onUseItem }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [hoveredItem, setHoveredItem] = useState(null);
  const popupRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const [isHoveringPrompt, setIsHoveringPrompt] = useState(false);

  // Create portal container for popups on component mount
  useEffect(() => {
    if (!document.getElementById("inventory-portal")) {
      const portalDiv = document.createElement("div");
      portalDiv.id = "inventory-portal";
      document.body.appendChild(portalDiv);
    }

    // Cleanup on unmount
    return () => {
      const portalDiv = document.getElementById("inventory-portal");
      if (portalDiv && portalDiv.childNodes.length === 0) {
        document.body.removeChild(portalDiv);
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Get icon class based on item name
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
      case "Takeaway Meal":
        return "item-icon-takeaway";
      default:
        return "item-icon-pencil";
    }
  };

  // Handle mouse enter for an item - FIXED: Only show for Takeaway Meal
  const handleMouseEnter = (e, item) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // ONLY show eat prompt for Takeaway Meal
    if (item?.name === "Takeaway Meal") {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredItem({
        ...item,
        rect: rect,
      });
    }
  };

  // Handle mouse leave for an item
  const handleMouseLeave = () => {
    if (isHoveringPrompt) return;

    hoverTimeoutRef.current = setTimeout(() => {
      if (!isHoveringPrompt) {
        setHoveredItem(null);
      }
    }, 100);
  };

  // Handle prompt mouse events
  const handlePromptMouseEnter = () => {
    setIsHoveringPrompt(true);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handlePromptMouseLeave = () => {
    setIsHoveringPrompt(false);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 100);
  };

  // Handle eating the takeaway meal - FIXED
  const handleEatMeal = () => {
    console.log("Eat button clicked!");
    if (hoveredItem && hoveredItem.name === "Takeaway Meal") {
      console.log("Eating meal...", hoveredItem);

      // Call the parent's onUseItem with the hovered item
      onUseItem(hoveredItem);

      // Clear hover state
      setHoveredItem(null);
      setIsHoveringPrompt(false);
    }
  };

  // Filter items based on selected category
  const displayItems = items.length > 0 ? items : [];
  const filteredItems = selectedCategory === "All" ? displayItems : displayItems.filter((item) => item.category === selectedCategory);

  // Render eat prompt using portal - FIXED: Only for Takeaway Meal
  const renderEatPrompt = () => {
    if (!hoveredItem || hoveredItem.name !== "Takeaway Meal") return null;

    const portalElement = document.getElementById("inventory-portal");
    if (!portalElement) return null;

    const { rect } = hoveredItem;

    // Calculate position - above the item with some margin
    const promptPosition = {
      top: rect.top - 80,
      left: rect.left + rect.width / 2,
    };

    // Make sure it stays within viewport
    const adjustedTop = Math.max(20, promptPosition.top);
    const adjustedLeft = Math.max(100, Math.min(window.innerWidth - 100, promptPosition.left));

    return ReactDOM.createPortal(
      <div
        className="eat-prompt-container"
        style={{
          top: `${adjustedTop}px`,
          left: `${adjustedLeft}px`,
          transform: "translateX(-50%)",
        }}
        onMouseEnter={handlePromptMouseEnter}
        onMouseLeave={handlePromptMouseLeave}
        ref={popupRef}
      >
        <div className="eat-prompt">
          <p>Do you want to eat this?</p>
          <div className="eat-prompt-buttons">
            <button className="yes-btn" onClick={handleEatMeal} type="button">
              Yes
            </button>
            <button
              className="no-btn"
              onClick={() => {
                setHoveredItem(null);
                setIsHoveringPrompt(false);
              }}
              type="button"
            >
              No
            </button>
          </div>
        </div>
      </div>,
      portalElement
    );
  };

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

        <div className="inventory-grid-container">
          <div className="inventory-grid">
            {filteredItems.map((item, index) => (
              <div key={`item-${item.id || index}`} className="inventory-slot filled" data-item-name={item.name} onMouseEnter={(e) => handleMouseEnter(e, item)} onMouseLeave={handleMouseLeave}>
                <div className={`item-icon ${getIconClass(item)}`}></div>
                <div className="item-quantity">{item.quantity}</div>
                <div className="item-tooltip">{item.name}</div>
              </div>
            ))}

            {/* Empty slots to fill the grid */}
            {Array.from({ length: Math.max(0, 25 - filteredItems.length) }).map((_, index) => (
              <div key={`empty-${index}`} className="inventory-slot empty"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Render eat prompt using portal */}
      {renderEatPrompt()}
    </div>
  );
}

export default Inventory;
