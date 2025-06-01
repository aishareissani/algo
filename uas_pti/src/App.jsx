// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoadingScreen from "./components/loading_screen";
import ChooseCharacter from "./components/choose_character";
import Map from "./components/map";
import House from "./components/house";
import Field from "./components/field";
import Beach from "./components/beach";
// import Restaurant from "./components/restaurant";
// import Mountain from "./components/mountain";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoadingScreen />} />
        <Route path="/choose_character" element={<ChooseCharacter />} />
        <Route path="/map" element={<Map />} />
        <Route path="/house" element={<House />} />
        <Route path="/field" element={<Field />} />
        <Route path="/beach" element={<Beach />} />
      </Routes>
    </Router>
  );
}

export default App;
