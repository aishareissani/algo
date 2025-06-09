module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pressstart: ['"Press Start 2P"', "system-ui"],
      },
      backgroundImage: {
        "loading-screen": "url('/assets/locations/loading_screen.jpg')",
        "choose-character": "url('/assets/locations/choose_screen.jpg')",
        "map-screen": "url('/assets/locations/map_screen.png')",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        dialogFadeIn: {
          "0%": { opacity: "0", transform: "translate(-50%, -50%) scale(0.9)" },
          "100%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        pulseMapMarker: {
          "0%, 100%": {
            transform: "translate(-50%, -50%) scale(1)",
            boxShadow: "0 0 4px #e9d669",
          },
          "50%": {
            transform: "translate(-50%, -50%) scale(1.3)",
            boxShadow: "0 0 10px #e9d669",
          },
        },
      },
      animation: {
        fadeIn: "fadeIn 2s ease-in-out forwards",
        dialogFadeIn: "dialogFadeIn 0.3s ease-out",
        pulseMapMarker: "pulseMapMarker 1.5s infinite ease-in-out",
      },
      boxShadow: {
        "inset-game": "inset 0 0 20px rgba(255, 255, 255, 0.2)",
      },
    },
  },
  plugins: [],
};
