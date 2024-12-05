import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Polygon, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import Navbar from "./Navbar";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

const CreateForest = () => {
  const [forestName, setForestName] = useState("");
  const [forestAreas, setForestAreas] = useState([]);
  const [formulaParams, setFormulaParams] = useState({
    x1: "",
    x2: "",
    x3: "",
    x4: "",
    x5: "",
    x6: "",
    x7: "",
    x8: "",
    x9: "",
    x10: "",
  });
  const [allForests, setAllForests] = useState([]);
  const featureGroupRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/forests`)
      .then((response) => {
        setAllForests(response.data);
      })
      .catch((error) => {
        console.error("Error fetching forests:", error);
      });
  }, []);

  const handleCreated = (e) => {
    const layer = e.layer;
    const coordinates = layer.getLatLngs()[0].map((latLng) => ({
      latitude: latLng.lat,
      longitude: latLng.lng,
    }));

    setForestAreas([coordinates]);
  };

  const handleDeleted = () => {
    setForestAreas([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormulaParams((prevParams) => ({
      ...prevParams,
      [name]: value,
    }));
  };

  const handleCreateForest = async () => {
    if (!forestName || forestAreas.length === 0) {
      alert("Please enter a forest name and draw at least one area.");
      return;
    }

    if (Object.values(formulaParams).some((value) => value === "")) {
      alert("Please fill in all formula parameters.");
      return;
    }

    const verticesOfForest = forestAreas[0].map((coord) => ({
      latitude: coord.latitude,
      longitude: coord.longitude,
    }));

    const nodesInForest = [];

    const forestData = {
      name: forestName,
      verticesOfForest,
      nodesInForest,
      formulaParams: {
        ...Object.fromEntries(
          Object.entries(formulaParams).map(([key, value]) => [key, parseFloat(value)])
        ),
      },
    };

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/forests`, forestData);
      alert("Forest created successfully!");
      setForestName("");
      setForestAreas([]);
      setFormulaParams({
        x1: "",
        x2: "",
        x3: "",
        x4: "",
        x5: "",
        x6: "",
        x7: "",
        x8: "",
        x9: "",
        x10: "",
      });
      navigate("/");
    } catch (error) {
      console.error("Error creating forest:", error);
      alert("Failed to create forest.");
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <Navbar />
      <div className="flex flex-grow">
        <div className="w-3/4 h-full">
          <MapContainer
            center={[33.8938, 36.5018]}
            zoom={9}
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {allForests.map((forest) => (
              <Polygon
                key={forest.id}
                positions={forest.verticesOfForest.map((vertex) => [
                  vertex.latitude,
                  vertex.longitude,
                ])}
                color="green"
              />
            ))}
            <FeatureGroup ref={featureGroupRef}>
              <EditControl
                position="topright"
                onCreated={handleCreated}
                onDeleted={handleDeleted}
                draw={{
                  rectangle: false,
                  circle: false,
                  polyline: false,
                  marker: false,
                  circlemarker: false,
                }}
              />
            </FeatureGroup>
          </MapContainer>
        </div>
        <div className="w-1/4 h-full p-4 bg-gray-100">
          <input
            type="text"
            placeholder="Enter forest name"
            value={forestName}
            onChange={(e) => setForestName(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          <div className="mb-4">
            {Object.keys(formulaParams).map((param) => (
              <div key={param} className="mb-2">
                <label className="block text-gray-700 mb-1">{param.toUpperCase()}</label>
                <input
                  type="number"
                  name={param}
                  value={formulaParams[param]}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleCreateForest}
            className="w-full bg-blue-500 text-white p-2 rounded"
          >
            Create Forest
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateForest;
