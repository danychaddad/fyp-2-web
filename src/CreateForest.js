// CreateForest.js
import React, { useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './CreateForest.css';

const CreateForest = () => {
    const featureGroupRef = useRef(null);
    const [forestAreas, setForestAreas] = useState([]); // Store multiple polygons

    // Predefined array of coordinates for a polygon
    const predefinedCoordinates = [
        [35.5, 36.0],
        [35.6, 36.1],
        [35.7, 36.0],
        [35.6, 35.9],
        [35.5, 36.0] // Closing the polygon by repeating the first coordinate
    ];

    const handleCreated = (e) => {
        const layer = e.layer;
        const coordinates = layer.getLatLngs()[0].map(latLng => ({
            lat: latLng.lat,
            lng: latLng.lng
        }));
        
        setForestAreas(prevAreas => [...prevAreas, coordinates]); // Add new coordinates to the array
        console.log("Selected Area Coordinates:", coordinates);
    };

    const handleDeleted = (e) => {
        const layers = e.layers;
        const deletedCoordinates = layers.getLayers().map(layer => layer.getLatLngs()[0].map(latLng => ({
            lat: latLng.lat,
            lng: latLng.lng,
        })));

        // Filter out the deleted areas
        setForestAreas(prevAreas => prevAreas.filter(area => {
            return !deletedCoordinates.some(deletedCoord => 
                JSON.stringify(deletedCoord) === JSON.stringify(area)
            );
        }));

        console.log("Deleted Areas Coordinates:", deletedCoordinates);
    };

    return (
        <div className="map-container">
            <MapContainer center={[35.5, 36.0]} zoom={6} className="map">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />
                
                {/* Display the predefined polygon */}
                <Polygon positions={predefinedCoordinates} color="green" />

                {/* Render all drawn polygons */}
                {forestAreas.map((coordinates, index) => (
                    <Polygon key={index} positions={coordinates} color="green" />
                ))}

                <FeatureGroup ref={featureGroupRef}>
                    <EditControl
                        position="topright"
                        onCreated={handleCreated}
                        onDeleted={handleDeleted} // Ensure this is correctly referenced
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

            {/* Section to display coordinates of all selected areas */}
            {forestAreas.length > 0 && (
                <div className="coordinates-display">
                    <h3>Newly Added Forest Areas</h3>
                    {forestAreas.map((area, index) => (
                        <div key={index}>
                            <p>Coordinates of Forest Number {index + 1}:</p>
                            <ul>
                                {area.map((coord, coordIndex) => (
                                    <li key={coordIndex}>
                                        <p style={{ margin: 0 }}>Lat: {coord.lat}</p>
                                        <p style={{ margin: 0 }}>Lng: {coord.lng}</p>
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
