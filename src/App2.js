import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Pie, Bar } from 'react-chartjs-2';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'chart.js/auto';
import './App2.css'; 

const MapIcon = new L.Icon({
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const locations = [
  { position: [48.8584, 2.2945], name: "Eiffel Tower" },
  { position: [43.6047, 1.4442], name: "Capitole de Toulouse" },
  { position: [45.7640, 4.8357], name: "Basilique Notre-Dame de Fourvière" },
  { position: [43.7102, 7.2620], name: "Promenade des Anglais" },
];

const App2 = () => {
  const centerPosition = [46.6034, 1.8883];

  const [node1Data, setNode1Data] = useState({
    macAddress: "00:1B:44:11:3A:B7",
    temperature: "25°C",
    humidity: "60%",
    time: new Date().toLocaleTimeString()
  });

  const [node2Data, setNode2Data] = useState({
    macAddress: "00:1B:44:11:3A:B8",
    temperature: "28°C",
    humidity: "65%",
    time: new Date().toLocaleTimeString()
  });

  const [node3Data, setNode3Data] = useState({
    macAddress: "00:1B:44:11:3A:B9",
    temperature: "27°C",
    humidity: "55%",
    time: new Date().toLocaleTimeString()
  });

  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const nodes = [node1Data, node2Data, node3Data];

  const refreshData = () => {
    setNode1Data(prevData => ({
      ...prevData,
      time: new Date().toLocaleTimeString()
    }));

    setNode2Data(prevData => ({
      ...prevData,
      time: new Date().toLocaleTimeString()
    }));

    setNode3Data(prevData => ({
      ...prevData,
      time: new Date().toLocaleTimeString()
    }));
  };

  const nextNodes = () => {
    if (currentNodeIndex < nodes.length - 2) {
      setCurrentNodeIndex(currentNodeIndex + 1);
    }
  };

  const prevNodes = () => {
    if (currentNodeIndex > 0) {
      setCurrentNodeIndex(currentNodeIndex - 1);
    }
  };

  const pieData = {
    labels: ['Critical', 'Moderate', 'Low'],
    datasets: [{
      label: 'Severity Levels',
      data: [30, 50, 20],
      backgroundColor: ['#FF0000', '#FF7F00', '#008000'],
    }]
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 12,
          },
          boxWidth: 20,
          padding: 15,
        },
      },
      title: {
        display: true,
      },
    },
  };

  const barData = {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    datasets: [
      {
        label: 'Incidents',
        data: [12, 19, 7, 10, 5, 2, 8],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 8,
          },
          padding: 5,
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          color: '#333',
          font: {
            size: 8,
          }
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          font: {
            size: 6,
          }
        }
      },
      y: {
        title: {
          display: true,
          color: '#333',
          font: {
            size: 8,
          }
        },
        ticks: {
          font: {
            size: 6,
          }
        },
        beginAtZero: true,
      }
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      }
    }
  };

  return (
    <div className="container">
      <div className="map-and-sensors">
        <MapContainer center={centerPosition} zoom={6} style={{ height: "267px", width: "50%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {locations.map((location, index) => (
            <Marker key={index} position={location.position} icon={MapIcon}>
              <Popup>{location.name}</Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="sensor-data">
          <h1>Sensor Data</h1>
          <div className="sensor-nodes">
            {nodes.slice(currentNodeIndex, currentNodeIndex + 2).map((nodeData, index) => (
              <div className="sensor-node" key={index}>
                <h2>Node {currentNodeIndex + index + 1}</h2>
                <p><strong>MAC Address:</strong> {nodeData.macAddress}</p>
                <p><strong>Temperature:</strong> {nodeData.temperature}</p>
                <p><strong>Humidity:</strong> {nodeData.humidity}</p>
                <p><strong>Time of Sensor Reading:</strong> {nodeData.time}</p>
              </div>
            ))}
          </div>

          <div className="button-container">
            <button className="nav-button" onClick={prevNodes} disabled={currentNodeIndex === 0}>
              &lt;
            </button>
            <button className="refresh-button" onClick={refreshData}>Refresh Data</button>
            <button className="nav-button" onClick={nextNodes} disabled={currentNodeIndex >= nodes.length - 2}>
              &gt;
            </button>
          </div>
        </div>
      </div>

      <div className="incidents-and-teams-and-pichart">
        <div className="current-incidents">
          <h1>Current Incidents</h1>
          <p>No incidents</p>
        </div>

        <div className="available-teams">
          <h1>Available Teams</h1>
          <ul>
            <li>Team 1</li>
            <li>Team 2</li>
            <li>Team 3</li>
          </ul>
        </div>

        <div className="charts-container">
          <div className="pie-chart-section">
            <h1 className='chart-title'>Past Week Statistics</h1>
            <Pie data={pieData} options={pieOptions} />
          </div>
          <div className="bar-chart-section">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};



export default App2;
