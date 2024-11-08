import React, { useRef, useState } from "react";
import { MapContainer, TileLayer, Polygon, FeatureGroup } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import axios from "axios";

const CreateForest = () => {
  const featureGroupRef = useRef(null);
  const [forestAreas, setForestAreas] = useState([]);
  const [forestName, setForestName] = useState("");
  const navigate = useNavigate();

  const handleCreated = (e) => {
    const layer = e.layer;
    const coordinates = layer.getLatLngs()[0].map((latLng) => ({
      latitude: latLng.lat,
      longitude: latLng.lng,
    }));

    setForestAreas([coordinates]);
    console.log("Selected Area Coordinates:", coordinates);
  };

  const handleDeleted = () => {
    setForestAreas([]);
    console.log("Deleted all areas");
  };

  const handleCreateForest = async () => {
    if (!forestName || forestAreas.length === 0) {
      alert("Please enter a forest name and draw at least one area.");
      return;
    }

    const verticesOfForest = forestAreas[0].map((coord) => ({
      latitude: coord.lat,
      longitude: coord.lng,
    }));

    const forestData = {
      name: forestName,
      verticesOfForest,
    };

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/forests`, forestData);
      alert("Forest created successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error creating forest:", error);
      alert("Failed to create forest.");
    }
  };

  return (
    <div className="map-container">
      <input
        type="text"
        placeholder="Enter forest name"
        value={forestName}
        onChange={(e) => setForestName(e.target.value)}
      />
      <button onClick={handleCreateForest}>Create Forest</button>

      <MapContainer center={[35.5, 36.0]} zoom={6} className="map">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {forestAreas.map((coordinates, index) => (
          <Polygon
            key={index}
            positions={coordinates.map((coord) => [
              coord.latitude,
              coord.longitude,
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

      {forestAreas.length > 0 && (
        <div className="coordinates-display">
          <h3>Newly Added Forest Areas</h3>
          {forestAreas.map((area, index) => (
            <div key={index}>
              <p>Coordinates of Forest Area:</p>
              <ul>
                {area.map((coord, coordIndex) => (
                  <li key={coordIndex}>
                    <p style={{ margin: 0 }}>
                      <strong>Lat:</strong> {coord.latitude}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Lng:</strong> {coord.longitude}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreateForest;
