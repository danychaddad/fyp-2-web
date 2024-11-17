import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./css/index.css";
import ForestDrawer from "./ForestDrawer";
import Navbar from "./Navbar";
import Papa from "papaparse";
import { Spinner } from "react-bootstrap";

const getMostRecentWeatherMap = async () => {
  const res = await fetch(
    "https://api.rainviewer.com/public/weather-maps.json"
  );
  const resJson = await res.json();
  return resJson.radar.nowcast[0].path;
};

const getFirmsFireData = async () => {
  const res = await fetch(
    "https://firms.modaps.eosdis.nasa.gov/api/country/csv/52726a73234b9b7b383ab53ad0f89a08/VIIRS_NOAA20_NRT/LBN/1"
  );
  const text = await res.text();
  return Papa.parse(text, { header: true }).data;
};

const fetchLatestSensorReading = async (nodeId) => {
  try {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/nodes/${nodeId}/readings`
    );
    const readings = await res.json();
    if (readings.length === 0) {
      return {
        temperature: NaN,
        humidity: NaN,
        gasSensorReading: NaN,
      };
    }
    // Get the latest reading by timestamp
    const latestReading = readings.reduce((latest, reading) =>
      new Date(reading.timestamp) > new Date(latest.timestamp)
        ? reading
        : latest
    );
    return latestReading;
  } catch (error) {
    console.error(`Error fetching sensor readings for node ${nodeId}:`, error);
    return {
      temperature: NaN,
      humidity: NaN,
      gasSensorReading: NaN,
    };
  }
};

const App = () => {
  const [forests, setForests] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [selectedForest, setSelectedForest] = useState(null);
  const [mostRecentWeatherMap, setMostRecentWeatherMap] = useState("");
  const [fires, setFires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredNodeReading, setHoveredNodeReading] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weatherMapPath, fireData, forestsResponse, nodesResponse] =
          await Promise.all([
            getMostRecentWeatherMap(),
            getFirmsFireData(),
            fetch(`${process.env.REACT_APP_API_URL}/forests`).then((res) =>
              res.json()
            ),
            fetch(`${process.env.REACT_APP_API_URL}/nodes`).then((res) =>
              res.json()
            ),
          ]);

        setMostRecentWeatherMap(weatherMapPath);
        setFires(fireData);
        setForests(forestsResponse);
        setNodes(nodesResponse);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleForestClick = (forest) => {
    setSelectedForest(forest);
  };

  const handleNodeHover = async (node) => {
    const latestReading = await fetchLatestSensorReading(node.id);
    setHoveredNodeReading({ ...latestReading, macAddress: node.macAddress });
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex justify-center items-center">
        <Spinner animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
      </div>
    );
  }

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

        {fires.map((fire, index) => (
          <Marker
            key={index}
            position={[parseFloat(fire.latitude), parseFloat(fire.longitude)]}
            icon={L.icon({
              iconUrl:
                "https://maps.gstatic.com/mapfiles/ms2/micons/firedept.png",
              iconSize: [32, 32],
            })}
          >
            <Popup>
              <div>
                <strong>NOAA-20</strong>
                <p>Detected at: {fire.acq_date}</p>
                <p>Day/Night: {fire.daynight}</p>
                <p>Brightness: {fire.bright_ti4}</p>
                <p>
                  Confidence:{" "}
                  {fire.confidence === "h"
                    ? "High"
                    : fire.confidence === "l"
                    ? "Low"
                    : "Normal"}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {nodes.map((node) => (
          <Marker
            key={node.macAddress}
            position={[node.latitude, node.longitude]}
            icon={L.icon({
              iconUrl:
                "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })}
            eventHandlers={{
              mouseover: () => handleNodeHover(node),
            }}
          >
            <Popup>
              {hoveredNodeReading?.macAddress === node.macAddress ? (
                <div>
                  <strong>MAC Address:</strong> {hoveredNodeReading.macAddress}
                  <p>Timestamp: {hoveredNodeReading.timestamp}</p>
                  <p>Temperature: {hoveredNodeReading.temperature || "NaN"}</p>
                  <p>Humidity: {hoveredNodeReading.humidity || "NaN"}</p>
                  <p>
                    Gas Sensor Reading:{" "}
                    {hoveredNodeReading.gasSensorReading || "NaN"}
                  </p>
                </div>
              ) : (
                <Spinner animation="border" role="status">
                  <span className="sr-only">Loading...</span>
                </Spinner>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {selectedForest && (
        <ForestDrawer
          forest={selectedForest}
          nodes={nodes.filter((n) => n.forestId === selectedForest.id)}
          onClose={() => setSelectedForest(null)}
        />
      )}
    </div>
  );
};

export default App;
