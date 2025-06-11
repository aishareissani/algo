import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { playBackgroundMusic, musicHealthCheck } from "./sound";

function LoadingScreen() {
  const navigate = useNavigate();

  const handleNextClick = () => {
    // Ensure music plays saat user klik
    playBackgroundMusic();
    navigate("/choose_character");
  };

  useEffect(() => {
    // Start music dan health checker
    playBackgroundMusic();
    musicHealthCheck();

    // Ensure music plays saat user interact dengan halaman
    const handleUserInteraction = () => {
      playBackgroundMusic();
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

  return (
    <div className="loading-screen bg-loading-screen fixed top-0 left-0 w-screen h-screen bg-no-repeat bg-center bg-cover z-1000 flex flex-col items-center justify-center">
      <h1 className="judul_load text-white text-judul uppercase flex flex-col items-center justify-center leading-[1.5] tracking-widest2 text-center select-none animate-title">
        <div className="title-fade animate-titleInLine delay-[500ms]">SUNNY</div>
        <div className="title-fade animate-titleInLine delay-[1000ms]">SIDE</div>
        <div className="title-fade animate-titleInLine delay-[1500ms]">FARM</div>
      </h1>
      <button
        onClick={handleNextClick}
        className="nextButton font-pressstart text-btn rounded-[20px] py-[15px] px-[40px] cursor-pointer border-none transition-transform transition-shadow duration-500 opacity-0 animate-titleButton delay-[2000ms] shadow-btn-default bg-btn-gradient hover:scale-110 hover:shadow-btn-hover"
      >
        NEXT
      </button>
    </div>
  );
}

export default LoadingScreen;
