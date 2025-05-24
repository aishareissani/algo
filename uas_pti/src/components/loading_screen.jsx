import React from "react";
import "../styles.css";

function LoadingScreen() {
  return (
    <div className="loadScreen">
      <h1 className="judul">
        <div>UCUP</div>
        <div>MENJELAJAHI</div>
        <div>NUSANTARA</div>
      </h1>
      <button className="nextButton">NEXT</button>
    </div>
  );
}

export default LoadingScreen;
