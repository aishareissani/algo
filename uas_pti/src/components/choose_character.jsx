import React, { useState } from "react";
import "../styles.css";

function ChooseCharacter() {
  const [name, setName] = useState("");

  return (
    <div className="characterScreen">
      <h1 className="pilih_chara">
        <span>CHOOSE YOUR</span>
        <span>CHARACTER</span>
      </h1>
      <input type="text" placeholder="Enter your name!" value={name} onChange={(e) => setName(e.target.value)} />
    </div>
  );
}

export default ChooseCharacter;
