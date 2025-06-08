import React, { useState, useEffect } from "react";
import "../task.css";

const Task = ({ currentLocation, containerWidth = 250, containerHeight = 350, isInsideLocation = false, customPosition = null, externalTasks = null, onTaskComplete = null }) => {
  const [selectedLocation, setSelectedLocation] = useState(currentLocation);
  const [locationIndex, setLocationIndex] = useState(0);
  const [taskFilter, setTaskFilter] = useState("all");
  const [showDailyButton, setShowDailyButton] = useState(true);
  const [showBonusButton, setShowBonusButton] = useState(true);
  const [tasks, setTasks] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);

  const locations = {
    beach: {
      title: "Beach",
      icon: "🏖️",
      tasks: [
        { id: "swim", name: "Go for a Swim", priority: "daily" },
        { id: "sunbath", name: "Enjoy Sunbath", priority: "daily" },
        { id: "sandcastle", name: "Build a Sandcastle", priority: "bonus" },
        { id: "seashell", name: "Search for Seashells", priority: "bonus" },
        { id: "flower", name: "Collect Flowers", priority: "bonus" },
        { id: "starfish", name: "Look for Starfish", priority: "bonus" },
      ],
    },
    field: {
      title: "Field",
      icon: "🌾",
      tasks: [
        { id: "swing", name: "Relax on the Swing", priority: "daily" },
        { id: "picnic", name: "Enjoy a Small Picnic", priority: "daily" },
        { id: "chair", name: "Sit and Rest Quietly", priority: "bonus" },
        { id: "fountain", name: "Chill by the Fountain", priority: "bonus" },
      ],
    },
    home: {
      title: "Home",
      icon: "🏠",
      tasks: [
        { id: "bed", name: "Rest on Bed", priority: "daily" },
        { id: "bath", name: "Take Bath", priority: "daily" },
        { id: "kitchen", name: "Grab a Quick Bite", priority: "daily" },
        { id: "cat", name: "Pet the Cat", priority: "bonus" },
        { id: "table", name: "Work from Home", priority: "bonus" },
      ],
    },
    mountain: {
      title: "Mountain",
      icon: "⛰️",
      tasks: [
        { id: "hike", name: "Go on a Hike", priority: "daily" },
        { id: "stream", name: "Splash in the Stream", priority: "daily" },
        { id: "flower", name: "Collect some Flower", priority: "bonus" },
        { id: "rock", name: "Collect some Rock", priority: "bonus" },
      ],
    },
    restaurant: {
      title: "Restaurant",
      icon: "🍽️",
      tasks: [
        { id: "takeaway", name: "Grab Some Takeaway Food", priority: "daily" },
        { id: "eat", name: "Enjoy a Tasty Meal", priority: "daily" },
        { id: "drink", name: "Sip on Fresh Juice", priority: "daily" },
      ],
    },
  };

  const locationKeys = Object.keys(locations);

  const shouldUseMinimizedBehavior = () => {
    return window.innerWidth <= 1024;
  };

  useEffect(() => {
    if (externalTasks) {
      setTasks(externalTasks);
    } else {
      const initialTaskState = {};
      Object.keys(locations).forEach((location) => {
        locations[location].tasks.forEach((task) => {
          const taskKey = `${location}-${task.id}`;
          initialTaskState[taskKey] = { ...task, completed: false };
        });
      });
      setTasks(initialTaskState);
    }
  }, [externalTasks]);

  useEffect(() => {
    if (currentLocation && locations[currentLocation]) {
      setSelectedLocation(currentLocation);
      const index = locationKeys.indexOf(currentLocation);
      if (index !== -1) {
        setLocationIndex(index);
      }
    }
  }, [currentLocation]);

  const handlePrevLocation = (e) => {
    e.stopPropagation();
    const newIndex = (locationIndex - 1 + locationKeys.length) % locationKeys.length;
    setLocationIndex(newIndex);
    setSelectedLocation(locationKeys[newIndex]);
  };

  const handleNextLocation = (e) => {
    e.stopPropagation();
    const newIndex = (locationIndex + 1) % locationKeys.length;
    setLocationIndex(newIndex);
    setSelectedLocation(locationKeys[newIndex]);
  };

  const toggleFilter = (e, filterType) => {
    e.stopPropagation();

    if (filterType === "daily") {
      if (showDailyButton && !showBonusButton) {
        setShowDailyButton(true);
        setShowBonusButton(true);
        setTaskFilter("all");
      } else if (showDailyButton && showBonusButton) {
        setShowDailyButton(false);
        setShowBonusButton(true);
        setTaskFilter("bonus");
      } else {
        setShowDailyButton(true);
        setShowBonusButton(false);
        setTaskFilter("daily");
      }
    } else if (filterType === "bonus") {
      if (showBonusButton && !showDailyButton) {
        setShowDailyButton(true);
        setShowBonusButton(true);
        setTaskFilter("all");
      } else if (showDailyButton && showBonusButton) {
        setShowDailyButton(true);
        setShowBonusButton(false);
        setTaskFilter("daily");
      } else {
        setShowDailyButton(false);
        setShowBonusButton(true);
        setTaskFilter("bonus");
      }
    }
  };

  const toggleTaskCompletion = (e, taskId) => {
    e.stopPropagation();
    const taskKey = `${selectedLocation}-${taskId}`;

    if (onTaskComplete) {
      onTaskComplete(taskId);
      return;
    }

    setTasks((prevTasks) => ({
      ...prevTasks,
      [taskKey]: {
        ...prevTasks[taskKey],
        completed: !prevTasks[taskKey]?.completed,
      },
    }));
  };

  const getFilteredTasks = () => {
    const locationData = locations[selectedLocation];
    if (!locationData) return [];

    let filteredTasks = locationData.tasks.map((task) => {
      const taskKey = `${selectedLocation}-${task.id}`;
      const taskWithState = tasks[taskKey] || { ...task, completed: false };
      return { ...task, completed: taskWithState.completed };
    });

    if (taskFilter !== "all") {
      filteredTasks = filteredTasks.filter((task) => task.priority === taskFilter);
    }

    filteredTasks.sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return 0;
    });

    return filteredTasks;
  };

  const toggleExpanded = () => {
    if (shouldUseMinimizedBehavior()) {
      setIsExpanded(!isExpanded);
    }
  };

  const closeModal = (e) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  const currentLocationData = locations[selectedLocation];
  const filteredTasks = getFilteredTasks();
  const fontSizeBase = Math.min(containerWidth, containerHeight) * 0.045;

  const styles = {
    container: {
      width: `${containerWidth}px`,
      height: `${containerHeight}px`,
      "--font-size-base": `${fontSizeBase}px`,
      "--font-size-small": `${fontSizeBase * 0.8}px`,
      "--font-size-large": `${fontSizeBase * 1.2}px`,
      "--padding-base": `${fontSizeBase}px`,
    },
  };

  return (
    <>
      {/* Minimized floating button */}
      <div
        className={`task-container ${shouldUseMinimizedBehavior() ? "minimized" : "expanded"} ${isInsideLocation ? "inside-location" : ""}`}
        style={{
          ...(customPosition ? customPosition : {}),
          marginTop: "10px",
        }}
        onClick={toggleExpanded}
      >
        {shouldUseMinimizedBehavior() && !isExpanded && <div className="task-minimized-view">📋</div>}

        {/* Desktop expanded view */}
        {!shouldUseMinimizedBehavior() && (
          <div className="task-window" style={styles.container}>
            <div className="task-header">
              <h2 className="task-title">QUEST LOG</h2>
            </div>

            <div className="task-location-selector">
              <button className="location-arrow" onClick={handlePrevLocation}>
                ◀
              </button>
              <div className="location-info">
                <span className="location-icon">{currentLocationData?.icon}</span>
                <span className="location-name">{currentLocationData?.title}</span>
              </div>
              <button className="location-arrow" onClick={handleNextLocation}>
                ▶
              </button>
            </div>

            <div className="task-categories">
              <button className={`category-btn ${showDailyButton ? "active" : ""}`} onClick={(e) => toggleFilter(e, "daily")}>
                Daily
              </button>
              <button className={`category-btn ${showBonusButton ? "active" : ""}`} onClick={(e) => toggleFilter(e, "bonus")}>
                Bonus
              </button>
            </div>

            <div className="task-list-container">
              <div className="task-list">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <div key={task.id} className={`task-item ${task.priority} ${task.completed ? "completed" : ""}`} onClick={(e) => toggleTaskCompletion(e, task.id)}>
                      <div className="task-item-content">
                        <span className="task-bullet">{task.completed ? "●" : "○"}</span>
                        <span className="task-name">{task.name}</span>
                      </div>
                      <span className={`task-badge ${task.priority}`}>{task.priority.toUpperCase()}</span>
                    </div>
                  ))
                ) : (
                  <div className="task-empty">No tasks available</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen modal for mobile/tablet */}
      {shouldUseMinimizedBehavior() && isExpanded && (
        <div className="task-modal-overlay" onClick={closeModal}>
          <div className="task-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="task-window task-window-modal">
              <div className="task-header">
                <h2 className="task-title">QUEST LOG</h2>
                <button className="task-close-btn" onClick={closeModal}>
                  ✕
                </button>
              </div>

              <div className="task-location-selector">
                <button className="location-arrow" onClick={handlePrevLocation}>
                  ◀
                </button>
                <div className="location-info">
                  <span className="location-icon">{currentLocationData?.icon}</span>
                  <span className="location-name">{currentLocationData?.title}</span>
                </div>
                <button className="location-arrow" onClick={handleNextLocation}>
                  ▶
                </button>
              </div>

              <div className="task-categories">
                <button className={`category-btn ${showDailyButton ? "active" : ""}`} onClick={(e) => toggleFilter(e, "daily")}>
                  Daily
                </button>
                <button className={`category-btn ${showBonusButton ? "active" : ""}`} onClick={(e) => toggleFilter(e, "bonus")}>
                  Bonus
                </button>
              </div>

              <div className="task-list-container">
                <div className="task-list">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <div key={task.id} className={`task-item ${task.priority} ${task.completed ? "completed" : ""}`} onClick={(e) => toggleTaskCompletion(e, task.id)}>
                        <div className="task-item-content">
                          <span className="task-bullet">{task.completed ? "●" : "○"}</span>
                          <span className="task-name">{task.name}</span>
                        </div>
                        <span className={`task-badge ${task.priority}`}>{task.priority.toUpperCase()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="task-empty">No tasks available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Task;
