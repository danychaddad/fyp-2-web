import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import CreateForest from "./CreateForest";
import AddNodes from "./AddNodes";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/create-forest" element={<CreateForest />} />
      <Route path="/add-nodes/:forestId" element={<AddNodes />} />
    </Routes>
  </BrowserRouter>
);