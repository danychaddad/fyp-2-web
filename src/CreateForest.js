
import React, { useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './CreateForest.css';

const CreateForest = () => {
    const featureGroupRef = useRef(null);
    const [forestAreas, setForestAreas] = useState([]); 

    
    const predefinedCoordinates = [
        [35.5, 36.0],
        [35.6, 36.1],
        [35.7, 36.0],
        [35.6, 35.9],
        [35.5, 36.0] 
    ];

    const handleCreated = (e) => {
        const layer = e.layer;
        const coordinates = layer.getLatLngs()[0].map(latLng => ({
            lat: latLng.lat,
            lng: latLng.lng
        }));
        
        setForestAreas(prevAreas => [...prevAreas, coordinates]); 
        console.log("Selected Area Coordinates:", coordinates);
    };

    const handleDeleted = (e) => {
        const layers = e.layers;
        const deletedCoordinates = layers.getLayers().map(layer => layer.getLatLngs()[0].map(latLng => ({
            lat: latLng.lat,
            lng: latLng.lng,
        })));

        
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
                
                
                <Polygon positions={predefinedCoordinates} color="green" />

                
                {forestAreas.map((coordinates, index) => (
                    <Polygon key={index} positions={coordinates} color="green" />
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
                            <p>Coordinates of Forest Number {index + 1}:</p>
                            <ul>
                                {area.map((coord, coordIndex) => (
                                    <li key={coordIndex}>
                                        <p style={{ margin: 0 }}><strong>Lat:</strong> {coord.lat}</p>
                                        <p style={{ margin: 0 }}><strong>Lng:</strong> {coord.lng}</p>
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

