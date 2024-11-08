import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import { useMapEvent } from 'react-leaflet/hooks';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// import './AddNodes.css';

const AddNodes = () => {
  const [markers, setMarkers] = useState([]);

  
  const polygonCoordinates = [
    [33.8, 35.5],
    [33.9, 35.7],
    [34.0, 35.8],
    [34.1, 35.7],
    [33.8, 35.5],
  ];

  const defaultIcon = new L.Icon({
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    shadowSize: [41, 41],
  });

  const isPointInPolygon = (point, polygon) => {
    const latLng = L.latLng(point.lat, point.lng);
    const polygonLayer = L.polygon(polygon);
    const bounds = polygonLayer.getBounds();
    const expandedBounds = bounds.pad(0.001);
    return expandedBounds.contains(latLng);
  };

  const MapClickHandler = () => {
    useMapEvent('click', (e) => {
      const clickedPosition = e.latlng;
      if (isPointInPolygon(clickedPosition, polygonCoordinates)) {
        const newMarker = {
          id: markers.length + 1,
          position: clickedPosition,
        };
        setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
      }
    });
    return null;
  };

  return (
    <div className="app-container">
      <div className="map-wrapper">
        <MapContainer center={[33.8547, 35.8623]} zoom={7} className="map-container">
          <MapClickHandler />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polygon positions={polygonCoordinates} color="blue" fillOpacity={0.3} />
          {markers.map((marker) => (
            <Marker key={marker.id} position={marker.position} icon={defaultIcon}>
              <Popup>
                A marker at {marker.position.lat.toFixed(4)}, {marker.position.lng.toFixed(4)}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      {markers.length > 0 && (
  <div className="coordinates-display">
    <h3>Nodes Positions</h3>
    <ul>
      {markers.map((marker) => (
        <li key={marker.id}>
          <strong>Lat:</strong> {marker.position.lat.toFixed(4)}, <strong>Lng:</strong> {marker.position.lng.toFixed(4)}
        </li>
      ))}
    </ul>
  </div>
)}
    </div>
  );
};

export default AddNodes;
