import React from "react";
import { useNavigate } from "react-router-dom";

function LoadingScreen() {
  const navigate = useNavigate();

  const handleNextClick = () => {
    navigate("/choose_character");
  };

  return (
    <div className="loadScreen">
      <h1 className="judul">
        <div>UCUP</div>
        <div>MENJELAJAHI</div>
        <div>NUSANTARA</div>
      </h1>
      <button className="nextButton" onClick={handleNextClick}>
        NEXT
      </button>
    </div>
  );
}

export default LoadingScreen;
