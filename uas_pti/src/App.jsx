import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoadingScreen from "./components/loading_screen";
import ChooseCharacter from "./components/choose_character";

function App() {
  console.log("App Rendered");
  return (
    <Routes>
      <Route path="/" element={<LoadingScreen />} />
      <Route path="/choose-character" element={<ChooseCharacter />} />
    </Routes>
  );
}

export default App;