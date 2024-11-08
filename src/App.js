import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "chart.js/auto";
import { Link } from "react-router-dom";
import "./css/index.css";
import ForestDrawer from "./ForestDrawer";

const App = () => {
  const centerPosition = [33.8938, 36.5018];
  const [forests, setForests] = useState([]);
  const [selectedForest, setSelectedForest] = useState(null);

  useEffect(() => {
    const fetchForests = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/forests`
        );
        const data = await response.json();
        setForests(data);
      } catch (error) {
        console.error("Error fetching forests:", error);
      }
    };
    fetchForests();
  }, []);

  const handleForestClick = (forest) => {
    setSelectedForest(forest);
  };

  return (
    <div className="h-screen w-screen relative">
      <MapContainer
        center={centerPosition}
        zoom={9}
        className="h-full w-full z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {forests.map((forest) => (
          <Polygon
            key={forest.id}
            positions={forest.verticesOfForest.map((vertex) => [
              vertex.latitude,
              vertex.longitude,
            ])}
            color="green"
            eventHandlers={{
              click: () => handleForestClick(forest),
            }}
          />
        ))}
      </MapContainer>

      <Link
        to="/create-forest"
        className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Create Forest
      </Link>

      {selectedForest && (
        <ForestDrawer
          forest={selectedForest}
          onClose={() => setSelectedForest(null)}
        />
      )}
    </div>
  );
};

export default App;
