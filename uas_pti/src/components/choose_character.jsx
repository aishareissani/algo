// choose_character.jsx
import React from "react";
import "../styles.css"; // Import CSS

function ChooseCharacter() {
    return (
        <div className="characterScreen">
            <h1 className="judul">
                <span>CHOOSE</span>
                <span>YOUR</span>
                <span>CHARACTER</span>
            </h1>
            <button>Select</button>
        </div>
    );
}

export default ChooseCharacter;