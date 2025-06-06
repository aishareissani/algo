import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SpeedModeProvider } from "./components/speed";
import LoadingScreen from "./components/loading_screen";
import ChooseCharacter from "./components/choose_character";
import Map from "./components/map";
import Home from "./components/home";
import Field from "./components/field";
import Beach from "./components/beach";
import Restaurant from "./components/restaurant";
import Mountain from "./components/mountain";
import Task from "./components/task"; // Import komponen Task

function App() {
  return (
    <Router>
      <SpeedModeProvider>
        <Routes>
          <Route path="/" element={<LoadingScreen />} />
          <Route path="/choose_character" element={<ChooseCharacter />} />
          <Route path="/map" element={<Map />} />
          <Route path="/home" element={<Home />} />
          <Route path="/field" element={<Field />} />
          <Route path="/beach" element={<Beach />} />
          <Route path="/restaurant" element={<Restaurant />} />
          <Route path="/mountain" element={<Mountain />} />
          <Route path="/tasks" element={<Task currentLocation="beach" completedActivities={["swim", "sunbath", "cat"]} />} />
        </Routes>
      </SpeedModeProvider>
    </Router>
  );
}

export default App;
