import React, { useState } from "react";
import { X, PlusCircle, ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ForestDrawer = ({ forest, onClose, refreshData, nodes }) => {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState(null);
  const [latestReading, setLatestReading] = useState(null);
  const [latestImage, setLatestImage] = useState(null);
  const [isImageOverlayOpen, setIsImageOverlayOpen] = useState(false);

  const handleAddNodes = () => {
    navigate(`/${forest.id}`);
  };

  const handleNodeClick = async (node) => {
    try {
      setSelectedNode(node);

      const readingsResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/nodes/${node.macAddress}/readings`
      );
      const readings = await readingsResponse.json();

      if (readings && readings.length > 0) {
        const latest = readings.reduce((prev, current) =>
          new Date(prev.timestamp) > new Date(current.timestamp)
            ? prev
            : current
        );
        setLatestReading(latest);
      } else {
        setLatestReading(null);
      }

      const imageResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/nodes/${node.macAddress}/images/latest`
      );
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        setLatestImage(imageData.image);
      } else {
        setLatestImage(null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setLatestReading(null);
      setLatestImage(null);
    }
  };

  const handleBack = () => {
    setSelectedNode(null);
    setLatestReading(null);
    setLatestImage(null);
  };

  const openImageOverlay = () => {
    setIsImageOverlayOpen(true);
  };

  const closeImageOverlay = () => {
    setIsImageOverlayOpen(false);
  };

  const downloadImage = () => {
    if (latestImage) {
      const link = document.createElement("a");
      link.href = latestImage;
      link.download = `node_${selectedNode.macAddress}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 flex flex-col">
      <div className="p-4">
        <button className="absolute top-4 right-4 text-xl" onClick={onClose}>
          <X />
        </button>
        {!selectedNode ? (
          <h1>{forest?.name || "Unnamed Forest"}</h1>
        ) : (
          <div className="flex items-center">
            <button className="mr-2" onClick={handleBack}>
              <ArrowLeft />
            </button>
            <h1>Node Details</h1>
          </div>
        )}
      </div>

      <div className="divide-y divide-black pt-4 grow overflow-y-auto">
        {!selectedNode ? (
          nodes.length > 0 ? (
            nodes.map((node, index) => (
              <div
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                key={node.macAddress}
                onClick={() => handleNodeClick(node)}
              >
                <h2>Node {index + 1}</h2>
                <p>
                  <strong>MAC Address:</strong> {node.macAddress || "N/A"}
                </p>
                <p>
                  <strong>Latitude:</strong> {node.latitude || "N/A"}
                </p>
                <p>
                  <strong>Longitude:</strong> {node.longitude || "N/A"}
                </p>
              </div>
            ))
          ) : (
            <div className="p-4">
              <p>No nodes found for this forest.</p>
            </div>
          )
        ) : (
          <div className="p-4">
            <h2>MAC Address: {selectedNode.macAddress}</h2>
            {latestImage && (
              <div className="mb-4">
                <img
                  src={latestImage}
                  alt="Latest Node"
                  className="w-full cursor-pointer"
                  onClick={openImageOverlay}
                />
              </div>
            )}
            {latestReading ? (
              <>
                <p>
                  <strong>Temperature:</strong> {latestReading.temperature}°C
                </p>
                <p>
                  <strong>Humidity:</strong> {latestReading.humidity}%
                </p>
                <p>
                  <strong>Gas Sensor Reading:</strong>{" "}
                  {latestReading.gasSensorReading}
                </p>
                <p>
                  <strong>Timestamp:</strong>{" "}
                  {new Date(latestReading.timestamp).toLocaleString()}
                </p>
              </>
            ) : (
              <p>No sensor readings available.</p>
            )}
          </div>
        )}
      </div>

      {!selectedNode && (
        <div className="my-6 mx-4 flex flex-col space-y-2">
          <button
            className="bg-blue-500 text-white w-full p-2 rounded-lg flex justify-center items-center"
            onClick={handleAddNodes}
          >
            <PlusCircle className="mr-2" /> Add Nodes
          </button>
          {/* <button
            className="bg-orange-300 w-full p-2 rounded-lg flex justify-center items-center"
            onClick={refreshData}
          >
            <RefreshCcw className="mr-2" /> Refresh Data
          </button> */}
        </div>
      )}

      {isImageOverlayOpen && latestImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
          <div className="relative">
            <img
              src={latestImage}
              alt="Node Overlay"
              className="max-w-full max-h-full"
            />
            <button
              className="absolute top-4 right-4 bg-white p-2 rounded-full"
              onClick={closeImageOverlay}
            >
              <X />
            </button>
            <button
              className="absolute bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full flex items-center"
              onClick={downloadImage}
            >
              <Download className="mr-2" /> Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForestDrawer;
