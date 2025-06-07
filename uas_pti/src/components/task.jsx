import React, { useState, useEffect } from "react";
import "../task.css";

const Task = ({ currentLocation, containerWidth = 250, containerHeight = 350, isInsideLocation = false, customPosition = null, externalTasks = null, onTaskComplete = null }) => {
  const [selectedLocation, setSelectedLocation] = useState(currentLocation);
  const [locationIndex, setLocationIndex] = useState(0);
  const [taskFilter, setTaskFilter] = useState("all");
  const [showDailyButton, setShowDailyButton] = useState(true);
  const [showBonusButton, setShowBonusButton] = useState(true);
  const [tasks, setTasks] = useState({});

  const locations = {
    beach: {
      title: "Beach",
      icon: "🏖️",
      tasks: [
        { id: "swim", name: "Swim Around", priority: "daily" },
        { id: "sunbath", name: "Enjoy Sunbath", priority: "daily" },
        { id: "sandcastle", name: "Make Sandcastle", priority: "bonus" },
        { id: "seashell", name: "Collect Seashells", priority: "bonus" },
        { id: "flower", name: "Collect Flowers", priority: "bonus" },
        { id: "starfish", name: "Find Starfish", priority: "bonus" },
      ],
    },
    field: {
      title: "Field",
      icon: "🌾",
      tasks: [
        { id: "swing", name: "Sit on the Swing", priority: "daily" },
        { id: "picnic", name: "Have a Picnic", priority: "daily" },
        { id: "chair", name: "Rest on Chair", priority: "bonus" },
        { id: "fountain", name: "Near Fountain", priority: "bonus" },
      ],
    },
    home: {
      title: "Home",
      icon: "🏠",
      tasks: [
        { id: "bed", name: "Rest on Bed", priority: "daily" },
        { id: "bath", name: "Take Bath", priority: "daily" },
        { id: "kitchen", name: "Eat in the Kitchen", priority: "daily" },
        { id: "cat", name: "Pet the Cat", priority: "bonus" },
        { id: "table", name: "Work from Home", priority: "bonus" },
      ],
    },
    mountain: {
      title: "Mountain",
      icon: "⛰️",
      tasks: [
        { id: "hike", name: "Start a Hike", priority: "daily" },
        { id: "stream", name: "Visit the Stream", priority: "daily" },
        { id: "flower", name: "Collect Flower", priority: "bonus" },
        { id: "rock", name: "Collect some Rock", priority: "bonus" },
      ],
    },
    restaurant: {
      title: "Restaurant",
      icon: "🍽️",
      tasks: [
        { id: "takeaway", name: "Order Takeaway", priority: "daily" },
        { id: "eat", name: "Eat Delicious Meal", priority: "daily" },
        { id: "drink", name: "Drink Some Juice", priority: "daily" },
      ],
    },
  };

  const locationKeys = Object.keys(locations);

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

  const handlePrevLocation = () => {
    const newIndex = (locationIndex - 1 + locationKeys.length) % locationKeys.length;
    setLocationIndex(newIndex);
    setSelectedLocation(locationKeys[newIndex]);
  };

  const handleNextLocation = () => {
    const newIndex = (locationIndex + 1) % locationKeys.length;
    setLocationIndex(newIndex);
    setSelectedLocation(locationKeys[newIndex]);
  };

  const toggleFilter = (filterType) => {
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

  const toggleTaskCompletion = (taskId) => {
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
    <div
      className={`task-container expanded ${isInsideLocation ? "inside-location" : ""}`}
      style={{
        ...(customPosition ? customPosition : {}),
        marginTop: "10px",
      }}
    >
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
          <button className={`category-btn ${showDailyButton ? "active" : ""}`} onClick={() => toggleFilter("daily")}>
            Daily
          </button>
          <button className={`category-btn ${showBonusButton ? "active" : ""}`} onClick={() => toggleFilter("bonus")}>
            Bonus
          </button>
        </div>

        <div className="task-list-container">
          <div className="task-list">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div key={task.id} className={`task-item ${task.priority} ${task.completed ? "completed" : ""}`} onClick={() => toggleTaskCompletion(task.id)}>
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
  );
};

export default Task;
