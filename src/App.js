import React, { useState, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
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

const createMarkerIcon = (color) => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="
        background-color: ${color};
        width: 15px;
        height: 15px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0,0,0,0.5);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [7, 7],
  });
};

const getDangerIcon = (dangerLevel) => {
  switch (dangerLevel) {
    case 2:
      return createMarkerIcon("#ff0000"); // Red
    case 1:
      return createMarkerIcon("#ffa500"); // Orange
    default:
      return createMarkerIcon("#00ff00"); // Green
  }
};

const isLeftTurn = (p1, p2, p3) => {
  return (
    (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]) > 0
  );
};

const createConvexHull = (points) => {
  if (points.length < 3) return points;

  const startPoint = points.reduce((lowest, point) =>
    point[0] < lowest[0] || (point[0] === lowest[0] && point[1] < lowest[1])
      ? point
      : lowest
  );

  const sortedPoints = points
    .filter((point) => point !== startPoint)
    .sort((a, b) => {
      const angleA = Math.atan2(a[0] - startPoint[0], a[1] - startPoint[1]);
      const angleB = Math.atan2(b[0] - startPoint[0], b[1] - startPoint[1]);
      return angleB - angleA;
    });

  const hull = [startPoint];
  sortedPoints.forEach((point) => {
    while (
      hull.length >= 2 &&
      !isLeftTurn(hull[hull.length - 2], hull[hull.length - 1], point)
    ) {
      hull.pop();
    }
    hull.push(point);
  });

  return hull;
};

const createNestedDangerZones = (nodes) => {
  const forestNodes = {};
  nodes.forEach((node) => {
    if (!node.forestId || node.dangerLevel === 0) return;

    if (!forestNodes[node.forestId]) {
      forestNodes[node.forestId] = {
        level1: [],
        level2: [],
      };
    }

    if (node.dangerLevel === 1) {
      forestNodes[node.forestId].level1.push(node);
    } else if (node.dangerLevel === 2) {
      forestNodes[node.forestId].level2.push(node);
    }
  });

  return Object.entries(forestNodes).flatMap(
    ([forestId, { level1, level2 }]) => {
      const zones = [];

      // Create outer perimeter (level 1)
      if (level1.length >= 3) {
        const level1Points = level1.map((node) => [
          node.latitude,
          node.longitude,
        ]);
        const outerHull = createConvexHull(level1Points);

        if (outerHull) {
          zones.push(
            <Polygon
              key={`outer-zone-${forestId}`}
              positions={outerHull}
              pathOptions={{
                color: "#ffa500",
                fillColor: "#ffa500",
                fillOpacity: 0.2,
                weight: 2,
                dashArray: "5, 10",
              }}
            />
          );
        }
      }

      // Create inner perimeter (level 2)
      if (level2.length >= 3) {
        const level2Points = level2.map((node) => [
          node.latitude,
          node.longitude,
        ]);
        const innerHull = createConvexHull(level2Points);

        if (innerHull) {
          zones.push(
            <Polygon
              key={`inner-zone-${forestId}`}
              positions={innerHull}
              pathOptions={{
                color: "#ff0000",
                fillColor: "#ff0000",
                fillOpacity: 0.3,
                weight: 2,
                dashArray: "5, 10",
              }}
            />
          );
        }
      }

      return zones;
    }
  );
};

const App = () => {
  const [forests, setForests] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [selectedForest, setSelectedForest] = useState(null);
  const [mostRecentWeatherMap, setMostRecentWeatherMap] = useState("");
  const [fires, setFires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nodeReadings, setNodeReadings] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);

  const fetchAndCacheNodeReading = useCallback(
    async (nodeId, macAddress) => {
      if (nodeReadings[nodeId]?.timestamp) {
        const readingAge =
          Date.now() - new Date(nodeReadings[nodeId].timestamp).getTime();
        if (readingAge < 60000) {
          return nodeReadings[nodeId];
        }
      }

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
            timestamp: new Date().toISOString(),
            macAddress,
          };
        }

        const latestReading = readings.reduce((latest, reading) =>
          new Date(reading.timestamp) > new Date(latest.timestamp)
            ? reading
            : latest
        );

        const readingWithMac = { ...latestReading, macAddress };
        setNodeReadings((prev) => ({
          ...prev,
          [nodeId]: readingWithMac,
        }));

        return readingWithMac;
      } catch (error) {
        console.error(
          `Error fetching sensor readings for node ${nodeId}:`,
          error
        );
        return {
          temperature: NaN,
          humidity: NaN,
          gasSensorReading: NaN,
          timestamp: new Date().toISOString(),
          macAddress,
        };
      }
    },
    [nodeReadings]
  );

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

    const refreshInterval = setInterval(fetchData, 10000); // Refresh every 10 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  const handleForestClick = (forest) => {
    setSelectedForest(forest);
  };

  const handleNodeClick = useCallback(
    async (node) => {
      setSelectedNode(node);
      const reading = await fetchAndCacheNodeReading(node.id, node.macAddress);
      setNodeReadings((prev) => ({
        ...prev,
        [node.id]: reading,
      }));
    },
    [fetchAndCacheNodeReading]
  );

  const findNodeByMac = (macAddress) => {
    return nodes.find((node) => node.macAddress === macAddress);
  };

  const renderNeighborConnections = () => {
    const renderedPairs = new Set();

    return nodes.flatMap((node) => {
      if (!node.neighbors) return [];

      return node.neighbors
        .map((neighborMac) => {
          const neighborNode = findNodeByMac(neighborMac);
          if (!neighborNode) return null;

          const pairId = [node.macAddress, neighborMac].sort().join("-");
          if (renderedPairs.has(pairId)) return null;
          renderedPairs.add(pairId);

          return (
            <Polyline
              key={pairId}
              positions={[
                [node.latitude, node.longitude],
                [neighborNode.latitude, neighborNode.longitude],
              ]}
              pathOptions={{
                color: "#3388ff",
                weight: 2,
                dashArray: "5, 10",
                opacity: 0.6,
              }}
            />
          );
        })
        .filter(Boolean);
    });
  };

  const renderDangerZones = () => {
    return createNestedDangerZones(nodes);
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

        {renderDangerZones()}
        {renderNeighborConnections()}

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
            icon={getDangerIcon(node.dangerLevel)}
            eventHandlers={{
              click: () => handleNodeClick(node),
              mouseover: () => handleNodeClick(node),
            }}
          >
            <Popup>
              {selectedNode?.macAddress === node.macAddress &&
              nodeReadings[node.id] ? (
                <div>
                  <strong>MAC Address:</strong>{" "}
                  {nodeReadings[node.id].macAddress}
                  <p>
                    Timestamp:{" "}
                    {new Date(nodeReadings[node.id].timestamp).toLocaleString()}
                  </p>
                  <p>
                    Temperature: {nodeReadings[node.id].temperature || "NaN"}
                  </p>
                  <p>Humidity: {nodeReadings[node.id].humidity || "NaN"}</p>
                  <p>
                    Gas Sensor Reading:{" "}
                    {nodeReadings[node.id].gasSensorReading || "NaN"}
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
