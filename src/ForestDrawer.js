import React from "react";
import { X, RefreshCcw, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ForestDrawer = ({ forest, onClose, refreshData }) => {
  const navigate = useNavigate();

  const handleAddNodes = () => {
    navigate(`/add-nodes/${forest.id}`);
  };

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 flex flex-col">
      <div className="p-4">
        <button className="absolute top-4 right-4 text-xl" onClick={onClose}>
          <X />
        </button>
        <h1>{forest?.name || "Unnamed Forest"}</h1>
      </div>

      <div className="divide-y divide-black pt-4 grow">
        {(forest?.nodesInForest || []).map((node, index) => (
          <div className="px-4 py-2" key={index}>
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
            <p>
              <strong>Sensor Readings Count:</strong>{" "}
              {node.sensorReadingIds?.length || 0}
            </p>
          </div>
        ))}
      </div>

      <div className="my-6 mx-4 flex flex-col space-y-2">
        <button
          className="bg-blue-500 text-white w-full p-2 rounded-lg flex justify-center items-center"
          onClick={handleAddNodes}
        >
          <PlusCircle className="mr-2" /> Add Nodes
        </button>
        <button
          className="bg-orange-300 w-full p-2 rounded-lg flex justify-center items-center"
          onClick={refreshData}
        >
          <RefreshCcw className="mr-2" /> Refresh Data
        </button>
      </div>
    </div>
  );
};

export default ForestDrawer;
