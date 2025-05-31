import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import StatsPlayer from "./stats_player";

function Map() {
  const location = useLocation();
  const navigate = useNavigate();

  const { characterName = "claire", playerName = "Player" } = location.state || {};

  const [playerPos, setPlayerPos] = useState({ x: 2110, y: 730 });
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const [showDialog, setShowDialog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

  const mapRef = useRef(null);
  const playerRef = useRef(null);

  const WORLD_WIDTH = 3700;
  const WORLD_HEIGHT = 1954;
  const VIEWPORT_WIDTH = 800;
  const VIEWPORT_HEIGHT = 600;
  const PLAYER_SIZE = 40;
  const MOVE_SPEED = 8;

  const isNearHouseDoor = (x, y) => {
    return x >= 1918 && x <= 2262 && y >= 430 && y <= 660;
  };
  const isNearField = (x, y) => {
    return x >= 2894 && x <= 3160 && y >= 762 && y <= 1026;
  };
  const isNearBeach = (x, y) => {
    return x >= 3238 && x <= 3575 && y >= 626 && y <= 1186;
  };
  const isNearResto = (x, y) => {
    return x >= 1526 && x <= 1718 && y >= 898 && y <= 1058;
  };
  const isNearGunung = (x, y) => {
    return x >= 176 && x <= 848 && y >= 40 && y <= 1034;
  };

  useEffect(() => {
    if (isNearHouseDoor(playerPos.x, playerPos.y)) {
      setCurrentLocation("house");
      setShowDialog(true);
    } else if (isNearField(playerPos.x, playerPos.y)) {
      setCurrentLocation("field");
      setShowDialog(true);
    } else if (isNearBeach(playerPos.x, playerPos.y)) {
      setCurrentLocation("beach");
      setShowDialog(true);
    } else if (isNearResto(playerPos.x, playerPos.y)) {
      setCurrentLocation("restaurant");
      setShowDialog(true);
    } else if (isNearGunung(playerPos.x, playerPos.y)) {
      setCurrentLocation("mountain");
      setShowDialog(true);
    } else {
      setCurrentLocation(null);
      setShowDialog(false);
    }
  }, [playerPos]);

  useEffect(() => {
    const cameraCenterX = playerPos.x - VIEWPORT_WIDTH / 2;
    const cameraCenterY = playerPos.y - VIEWPORT_HEIGHT / 2;

    const clampedX = Math.max(0, Math.min(WORLD_WIDTH - VIEWPORT_WIDTH, cameraCenterX));
    const clampedY = Math.max(0, Math.min(WORLD_HEIGHT - VIEWPORT_HEIGHT, cameraCenterY));

    setCameraPos({ x: clampedX, y: clampedY });
  }, [playerPos]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      setPlayerPos((prev) => {
        let newX = prev.x;
        let newY = prev.y;

        switch (e.key) {
          case "ArrowUp":
          case "w":
          case "W":
            newY = Math.max(0, prev.y - MOVE_SPEED);
            break;
          case "ArrowDown":
          case "s":
          case "S":
            newY = Math.min(1745, prev.y + MOVE_SPEED);
            break;
          case "ArrowLeft":
          case "a":
          case "A":
            newX = Math.max(0, prev.x - MOVE_SPEED);
            break;
          case "ArrowRight":
          case "d":
          case "D":
            newX = Math.min(3575, prev.x + MOVE_SPEED);
            break;
          default:
            return prev;
        }

        return { x: newX, y: newY };
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (
      // house
      (playerPos.x >= 1918 && playerPos.x <= 2262 && playerPos.y >= 430 && playerPos.y <= 660) ||
      // field
      (playerPos.x >= 2894 && playerPos.x <= 3160 && playerPos.y >= 762 && playerPos.y <= 1026) ||
      // beach
      (playerPos.x >= 3238 && playerPos.x <= 3575 && playerPos.y >= 626 && playerPos.y <= 1186) ||
      // resto
      (playerPos.x >= 1526 && playerPos.x <= 1718 && playerPos.y >= 898 && playerPos.y <= 1058) ||
      // gunung
      (playerPos.x >= 176 && playerPos.x <= 848 && playerPos.y >= 40 && playerPos.y <= 1034)
    ) {
      setShowDialog(true);
    } else {
      setShowDialog(false);
    }
  }, [playerPos]);

  const handleEnterLocation = () => {
    if (!currentLocation) return;

    navigate(`/${currentLocation}`, {
      state: { characterName, playerName },
    });
  };

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-[#80664f] overflow-hidden flex items-center justify-center">
      {showDialog && currentLocation && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f8f8ff] backdrop-blur-[5px] px-[35px] py-[25px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] text-center border-[3px] border-[#79d959] z-[100] animate-dialogFadeIn rounded-[15px]">
          <p className="text-[18px] mb-[25px] font-bold tracking-[0.5px] text-[#4d4d4d] leading-[1.6] text-center">
            Do you want
            <br />
            to enter
            <br />
            the {capitalize(currentLocation)}?
          </p>
          <button
            className="mx-2 px-5 py-[10px] text-[14px] font-bold border-none margin-[10px] cursor-pointer transition-all duration-200 ease-in-out shadow-[0_4px_8px_rgba(0,0,0,0.15)] font-pressstart bg-[#79d959] text-[#f8f8ff] hover:transform hover:-translate-y-0.5 hover:shadow-[0_6px_12px_rgba(0,0,0,0.2)]"
            style={{ textShadow: "1px 1px 0 rgba(0, 0, 0, 0.2)" }}
            onClick={handleEnterLocation}
          >
            Yes
          </button>
          <button
            className="mx-2 px-5 py-[10px] text-[14px] font-bold border-none rounded-lg cursor-pointer transition-all duration-200 ease-in-out shadow-[0_4px_8px_rgba(0,0,0,0.15)] font-pressstart bg-[#bc8044] text-[#f8f8ff] hover:transform hover:-translate-y-0.5 hover:shadow-[0_6px_12px_rgba(0,0,0,0.2)]"
            style={{ textShadow: "1px 1px 0 rgba(0, 0, 0, 0.2)" }}
            onClick={() => setShowDialog(false)}
          >
            No
          </button>
        </div>
      )}

      <div
        className="w-[800px] h-[600px] border-4 border-[#78d658] rounded-xl overflow-hidden relative shadow-[0_0_30px_rgba(121,216,88,0.3)] bg-[#f0f9e6]"
        ref={mapRef}
        style={{ boxShadow: "0 0 30px rgba(121, 216, 88, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.2)" }}
      >
        <div
          className="absolute w-[3700px] h-[1954px] top-0 left-0 will-change-transform bg-cover bg-no-repeat bg-center"
          style={{
            transform: `translate(-${cameraPos.x}px, -${cameraPos.y}px)`,
            backgroundImage: 'url("/assets/locations/map_screen.png")',
            backgroundSize: "100% 100%",
          }}
        >
          <div className="absolute w-10 h-[60px] z-10 transition-none" ref={playerRef} style={{ left: playerPos.x, top: playerPos.y }}>
            <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" style={{ imageRendering: "pixelated" }} draggable={false} />
          </div>
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 font-pressstart">
        <div className="absolute top-5 right-5 w-[190px] h-[100px] bg-[#f8f8ff] border-[3px] border-[#79d959] rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
          <span className="absolute top-[5px] left-[10px] text-[8px] text-[#79d959]" style={{ textShadow: "1px 1px 0 rgba(255, 255, 255, 0.7)" }}>
            MAP
          </span>
          <div className="relative w-full h-full bg-cover bg-no-repeat bg-center" style={{ backgroundImage: 'url("/assets/locations/map_screen.png")' }}>
            <div
              className="absolute w-[6px] h-[6px] bg-[#e9d669] border border-[#f8f8ff] rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_#e9d669] animate-pulseMapMarker"
              style={{
                left: `${((playerPos.x + PLAYER_SIZE / 2) / WORLD_WIDTH) * 100}%`,
                top: `${((playerPos.y + 60 / 2) / WORLD_HEIGHT) * 100}%`,
              }}
            />

            <div
              className="absolute border-2 border-[#f8f8ff] bg-white/20"
              style={{
                left: `${(cameraPos.x / WORLD_WIDTH) * 100}%`,
                top: `${(cameraPos.y / WORLD_HEIGHT) * 100}%`,
                width: `${(VIEWPORT_WIDTH / WORLD_WIDTH) * 100}%`,
                height: `${(VIEWPORT_HEIGHT / WORLD_HEIGHT) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="absolute top-5 left-5 flex items-center gap-3 bg-[#f8f8ff] px-4 py-3 rounded-[5px] border-[3px] border-[#79d959] font-pressstart text-[#4d4d4d] text-[10px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] m-[30px] p-[4px]">
          <img src={`/assets/avatar/${characterName}.png`} alt={characterName} className="w-[55px] ml-[10px] h-9 rounded-full border-2 border-[#79d959] bg-[#f8f8ff] shadow-[0_0_0_2px_rgba(121,216,88,0.3)]" />
          <div className="text-[10px] ml-[10px] p-[5px]">
            {playerName.toUpperCase()} • X: {Math.floor(playerPos.x)} Y: {Math.floor(playerPos.y)}
          </div>
        </div>

        <div className="pointer-events-auto">
          <StatsPlayer playerName={playerName} characterName={characterName} />
        </div>

        <div className="absolute bottom-5 left-5 bg-[#f8f8ff] px-[15px] py-3 rounded-xl border-[3px] border-[#51b3f0] font-pressstart text-[#4d4d4d] text-[8px] leading-[1.5] shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
          <div className="flex items-center gap-2 mb-[5px]">🎮 Arrow Keys / WASD to move</div>
          <div className="flex items-center gap-2">🗺️ Explore the village!</div>
        </div>
      </div>
    </div>
  );
}

export default Map;
