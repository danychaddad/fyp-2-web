import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Navbar from './Navbar';
import { Trash2 } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AddNodes = () => {
  const { forestId } = useParams();
  const [forest, setForest] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [newNode, setNewNode] = useState({ macAddress: '', position: null });
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/forests/${forestId}`)
      .then((response) => {
        setForest(response.data);
      })
      .catch((error) => {
        console.error('Error fetching forest:', error);
      });

    axios
      .get(`${process.env.REACT_APP_API_URL}/forests/${forestId}/nodes`)
      .then((response) => {
        setNodes(response.data);
      })
      .catch((error) => {
        console.error('Error fetching nodes:', error);
      });
  }, [forestId]);

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        const point = L.latLng(lat, lng);
        if (forest) {
          const polygon = L.polygon(
            forest.verticesOfForest.map((vertex) => [vertex.latitude, vertex.longitude])
          );
          if (polygon.getBounds().contains(point)) {
            setNewNode({ ...newNode, position: { latitude: lat, longitude: lng } });
            setError('');
          } else {
            alert('You can only add nodes within the forest boundaries.');
          }
        }
      },
    });
    return null;
  };

  const validateMacAddress = (mac) => {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  };

  const handleAddNode = async () => {
    const { macAddress, position } = newNode;

    if (!validateMacAddress(macAddress)) {
      setError('Invalid MAC address. Please enter a valid MAC address (e.g., 00:1A:2B:3C:4D:5E).');
      return;
    }

    if (!position) {
      setError('Please select a position for the node within the forest boundaries.');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/nodes/hello`, {
        macAddress,
        latitude: position.latitude,
        longitude: position.longitude,
        forestId,
      });

      if (response.status === 201 || response.status === 202) {
        setNodes([...nodes, response.data]);
        setNewNode({ macAddress: '', position: null });
        setError('');
        alert('Node added successfully.');
      }
    } catch (error) {
      console.error('Error adding node:', error);
      setError('Failed to add node. Please try again later.');
    }
  };

  const handleDeleteNode = async (macAddress) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/nodes/${macAddress}`);
      setNodes(nodes.filter((node) => node.macAddress !== macAddress));
    } catch (error) {
      console.error('Error deleting node:', error);
      alert('Failed to delete node. Please try again.');
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <Navbar />
      <div className="flex flex-grow">
        <div className="w-3/4 h-full">
          <MapContainer center={[33.8938, 36.5018]} zoom={9} className="h-full w-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <MapClickHandler />
            {forest && (
              <Polygon
                positions={forest.verticesOfForest.map((vertex) => [
                  vertex.latitude,
                  vertex.longitude,
                ])}
                color="green"
              />
            )}
            {nodes.map((node) => (
              <Marker
                key={node.macAddress}
                position={[node.latitude, node.longitude]}
              />
            ))}
            {newNode.position && (
              <Marker position={[newNode.position.latitude, newNode.position.longitude]} />
            )}
          </MapContainer>
        </div>
        <div className="w-1/4 h-full p-4 bg-gray-100">
          <h2 className="text-lg font-semibold mb-4">Add Node</h2>
          <input
            type="text"
            placeholder="Enter MAC address"
            value={newNode.macAddress}
            onChange={(e) => setNewNode({ ...newNode, macAddress: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
          />
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <button
            onClick={handleAddNode}
            className="w-full bg-blue-500 text-white p-2 rounded"
          >
            Add Node
          </button>
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Nodes in Forest</h2>
            <div className="space-y-4">
              {nodes.map((node) => (
                <div
                  key={node.macAddress}
                  className="p-3 border rounded shadow flex justify-between items-center bg-white"
                >
                  <div>
                    <p><strong>MAC Address:</strong> {node.macAddress}</p>
                    <p><strong>Latitude:</strong> {node.latitude}</p>
                    <p><strong>Longitude:</strong> {node.longitude}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteNode(node.macAddress)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNodes;
