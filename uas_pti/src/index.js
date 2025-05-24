// index.js
import React from "react";
import ReactDOM from "react-dom/client"; // Perhatikan perubahan ini
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);