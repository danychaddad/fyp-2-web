import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "chart.js/auto";
import "./css/index.css";
import ForestDrawer from "./ForestDrawer";
import Navbar from "./Navbar";

const getMostRecentWeatherMap = async () => {
  const res = await fetch(
    "https://api.rainviewer.com/public/weather-maps.json"
  );
  const resJson = await res.json();
  return resJson.radar.nowcast[0].path;
};

const App = () => {
  const [forests, setForests] = useState([]);
  const [selectedForest, setSelectedForest] = useState(null);
  const [mostRecentWeatherMap, setMostRecentWeatherMap] = useState("");

  useEffect(() => {
    (async () => {
      const path = await getMostRecentWeatherMap();
      setMostRecentWeatherMap(path);
    })();
  });

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
    <div className="h-screen w-screen flex flex-col">
      <Navbar />
      <MapContainer
        center={[33.8938, 36.5018]}
        zoom={9}
        className="h-full w-full z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <TileLayer
          attribution="RainViewer.com"
          url={`https://tilecache.rainviewer.com${mostRecentWeatherMap}/256/{z}/{x}/{y}/2/1_1.png`}
          opacity={0.6}
          zIndex={2}
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
