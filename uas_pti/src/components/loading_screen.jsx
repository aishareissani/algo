import React from "react";
import { useNavigate } from "react-router-dom";

function LoadingScreen() {
  const navigate = useNavigate();

  // Debugging untuk memastikan tombol NEXT bekerja:
  console.log("LoadingScreen Rendered");

  return (
    <div className="loadScreen">
      <h1 className="judul">
        <span>UCUP</span>
        <span>MENJELAJAHI</span>
        <span>NUSANTARA</span>
      </h1>
      <input
        type="button"
        value="NEXT"
        onClick={() => {
          console.log("Navigating to /choose-character");
          navigate("/choose-character");
        }}
      />
    </div>
  );
}

export default LoadingScreen;