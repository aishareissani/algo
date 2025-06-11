import React from "react";
import "../gif.css";

const Gif = ({ activity, location, isWalking, characterName = "keni", walkingDirection = "down" }) => {
  // Fungsi untuk mendapatkan path gif berdasarkan aktivitas dan lokasi
  const getGifPath = (location, activity) => {
    const basePath = "/assets/gif/";

    // Jika sedang jalan dan isWalking true, gunakan gif jalan sesuai arah
    if (activity === "jalan" && isWalking) {
      const walkingGifs = {
        right: `${characterName}_jalan_kanan.gif`,
        left: `${characterName}_jalan_kiri.gif`,
        up: `${characterName}_jalan_atas.gif`,
        down: `${characterName}_jalan_bawah.gif`,
      };
      return basePath + walkingGifs[walkingDirection];
    }

    // Mapping aktivitas ke nama file gif (dengan prefix karakter)
    const activityGifs = {
      // Rumah
      tidur: `${characterName}_tidur.gif`,
      mandi: `${characterName}_mandi.gif`,
      makan: `${characterName}_makan.gif`,
      "work from home": `${characterName}_wfh.gif`,
      "main kucing": `${characterName}_kucing.gif`,

      // Restoran
      "pesan makan": `${characterName}_makan.gif`,
      "pesen minum": `${characterName}_minum.gif`,
      "pesen takeaway": `${characterName}_takeaway.gif`,

      // Lapangan
      "main ayunan": `${characterName}_ayunan.gif`,
      piknik: `${characterName}_piknik.gif`,
      "duduk2 di kursi": `${characterName}_duduk.gif`,
      "lempar koin": `${characterName}_koin.gif`,

      // Gunung
      mendaki: `${characterName}_mendaki.gif`,
      "ke air main air": `${characterName}_air.gif`,
      "simpan bunga": `${characterName}_item.gif`,
      "simpan bebatuan": `${characterName}_item.gif`,

      // Pantai
      berenang: `${characterName}_renang.gif`,
      berjemur: `${characterName}_sunbath.gif`,
      "buat istana pasir": `${characterName}_pasir.gif`,
      "simpan kerang": `${characterName}_item.gif`,
      "simpan bunga pantai": `${characterName}_item.gif`,

      // Universal (jalan default jika tidak ada isWalking)
      jalan: `${characterName}_jalan_bawah.gif`,
    };

    return basePath + (activityGifs[activity] || "default.gif");
  };

  return (
    <div className="gif-container">
      <img
        src={getGifPath(location, activity)}
        alt={`${activity} gif`}
        className={`activity-gif ${activity === "jalan" ? "walking-gif" : ""}`}
        onError={(e) => {
          e.target.src = "/assets/gif/default.gif";
        }}
        draggable={false}
      />
      {/* HAPUS SEMUA label dan tulisan */}
    </div>
  );
};

export default Gif;
