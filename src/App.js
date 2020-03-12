import React, { useState } from "react";
import ReactDOM from "react-dom";
import './App.css';

import MapChart from "./MapChart";

function App() {
  const [content, setContent] = useState("");
  return (
    <div>
      <MapChart setTooltipContent={setContent} />      
    </div>
  );
}

export default App;
