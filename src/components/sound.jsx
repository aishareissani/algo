// Global background music instance
let backgroundMusic = null;
let isBackgroundMusicInitialized = false;
let isMusicPlaying = false;
let isMusicStopped = false; // Flag untuk cek apakah music sengaja di-stop

// Walking sound system
let walkingSoundInterval = null;
let isWalkingSoundActive = false;

// Initialize background music (cuma sekali)
const initBackgroundMusic = () => {
  if (!isBackgroundMusicInitialized) {
    backgroundMusic = new Audio("/assets/sound/track.mp3");
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3;

    // Event listeners untuk track music state
    backgroundMusic.addEventListener("play", () => {
      isMusicPlaying = true;
      console.log("Background music started");
    });

    backgroundMusic.addEventListener("pause", () => {
      isMusicPlaying = false;
      console.log("Background music paused");
    });

    backgroundMusic.addEventListener("ended", () => {
      isMusicPlaying = false;
      console.log("Background music ended");
    });

    isBackgroundMusicInitialized = true;
  }
  return backgroundMusic;
};

// Background music controls
export const playBackgroundMusic = () => {
  const music = initBackgroundMusic();

  if (!isMusicPlaying && !isMusicStopped) {
    music
      .play()
      .then(() => {
        console.log("Background music playing successfully");
      })
      .catch((error) => {
        console.log("Background music failed to play:", error);
        // Retry setelah user interaction
        document.addEventListener(
          "click",
          () => {
            if (!isMusicStopped) {
              music.play().catch(console.error);
            }
          },
          { once: true }
        );
      });
  }
};

// Fungsi untuk ensure music tetap playing
export const ensureBackgroundMusicPlaying = () => {
  if (backgroundMusic && !isMusicPlaying && !isMusicStopped) {
    console.log("Restarting background music...");
    playBackgroundMusic();
  }
};

export const stopBackgroundMusic = () => {
  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    isMusicPlaying = false;
    isMusicStopped = true;

    // Stop health check juga
    stopMusicHealthCheck();

    console.log("Background music stopped permanently");
  }
};

export const pauseBackgroundMusic = () => {
  if (backgroundMusic) {
    backgroundMusic.pause();
    isMusicPlaying = false;
  }
};

export const resumeBackgroundMusic = () => {
  if (backgroundMusic && !isMusicStopped) {
    backgroundMusic.play().catch(console.error);
  }
};

// Reset music state (untuk new game)
export const resetMusicState = () => {
  isMusicStopped = false;
  console.log("Music state reset - ready to play again");
};

// Sound effects
const sounds = {
  levelUp: "/assets/sound/level.mp3",
  start: "/assets/sound/start.mp3",
  over: "/assets/sound/over.mp3",
  jalan: "/assets/sound/jalan.mp3",
};

// PERBAIKAN: Satu fungsi playSound dengan volume parameter
export const playSound = (soundName, volume = 0.7) => {
  if (sounds[soundName]) {
    const audio = new Audio(sounds[soundName]);
    audio.volume = volume; // Set volume sesuai parameter
    audio.play().catch((error) => {
      console.warn(`Failed to play ${soundName}:`, error);
    });
  } else {
    console.warn(`Sound ${soundName} not found`);
  }
};

// Fungsi khusus untuk level up dengan volume lebih kecil
export const playLevelUpSound = (volume = 0.3) => {
  if (sounds.levelUp) {
    const audio = new Audio(sounds.levelUp);
    audio.volume = volume; // Volume lebih kecil untuk level up
    audio.play().catch((error) => {
      console.warn(`Failed to play levelUp:`, error);
    });
  }
};

// PERBAIKAN: Walking sound controls dengan volume parameter
export const startWalkingSound = (intervalMs = 500) => {
  console.log("Starting walking sound, current active:", isWalkingSoundActive);

  if (isWalkingSoundActive) return;

  isWalkingSoundActive = true;

  // Play first sound immediately dengan volume lebih kecil
  playSound("jalan", 0.4);

  // Clear any existing interval first
  if (walkingSoundInterval) {
    clearInterval(walkingSoundInterval);
  }

  walkingSoundInterval = setInterval(() => {
    console.log("Walking sound interval tick, active:", isWalkingSoundActive);
    if (isWalkingSoundActive) {
      playSound("jalan", 0.4); // Volume walking sound 40%
    } else {
      // Auto-cleanup if not active
      clearInterval(walkingSoundInterval);
      walkingSoundInterval = null;
    }
  }, intervalMs);
};

export const stopWalkingSound = () => {
  console.log("Stopping walking sound, was active:", isWalkingSoundActive);

  isWalkingSoundActive = false;

  if (walkingSoundInterval) {
    clearInterval(walkingSoundInterval);
    walkingSoundInterval = null;
  }

  console.log("Walking sound stopped successfully");
};

// Auto-restart music checker (panggil ini secara berkala)
let musicHealthCheckInterval = null;

export const musicHealthCheck = () => {
  // Clear existing interval first
  if (musicHealthCheckInterval) {
    clearInterval(musicHealthCheckInterval);
  }

  musicHealthCheckInterval = setInterval(() => {
    // HANYA restart jika music tidak sengaja di-stop
    if (!isMusicStopped) {
      ensureBackgroundMusicPlaying();
    }
  }, 5000);
};

export const stopMusicHealthCheck = () => {
  if (musicHealthCheckInterval) {
    clearInterval(musicHealthCheckInterval);
    musicHealthCheckInterval = null;
    console.log("Music health check stopped");
  }
};

// TAMBAHAN: Cleanup all audio
export const cleanupAllAudio = () => {
  stopWalkingSound();
  stopBackgroundMusic();
  stopMusicHealthCheck();
  console.log("All audio systems cleaned up");
};

export default {
  playBackgroundMusic,
  stopBackgroundMusic,
  pauseBackgroundMusic,
  resumeBackgroundMusic,
  playSound,
  playLevelUpSound, // TAMBAH ini ke export
  startWalkingSound,
  stopWalkingSound,
  ensureBackgroundMusicPlaying,
  musicHealthCheck,
  stopMusicHealthCheck,
  resetMusicState,
  cleanupAllAudio,
};
