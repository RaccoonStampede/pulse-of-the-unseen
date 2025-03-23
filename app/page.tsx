"use client"; // This tells Next.js this is a client-side component

import { useState, useEffect } from 'react';
import * as THREE from 'three';

// Define the props type for TypeScript
interface PulseVisualizationProps {
  color?: string;
  pulseRate?: number;
}

// Component for the pulsing visualization
const PulseVisualization: React.FC<PulseVisualizationProps> = ({ color, pulseRate }) => {
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(1, 16, 16); // Simple sphere for performance
    const material = new THREE.MeshBasicMaterial({ color: color || '#00ff00' });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      const rate = pulseRate || 0.5;
      sphere.scale.x = 1 + Math.sin(Date.now() * 0.001 * rate) * 0.5;
      sphere.scale.y = 1 + Math.sin(Date.now() * 0.001 * rate) * 0.5;
      sphere.scale.z = 1 + Math.sin(Date.now() * 0.001 * rate) * 0.5;
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on component unmount
    return () => {
      document.body.removeChild(renderer.domElement);
    };
  }, [color, pulseRate]);

  return null;
};

// Define the pulse data type
interface PulseData {
  phrase: string;
  color: string;
  pulseRate: number;
}

// Main page component
export default function Home() {
  const [description, setDescription] = useState<string>('');
  const [pulseData, setPulseData] = useState<PulseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      const data: PulseData = await response.json();
      setPulseData(data);
    } catch (error) {
      console.error('Error fetching pulse data:', error);
      setPulseData({
        phrase: 'Error generating pulse',
        color: '#ff0000', // Red color for error
        pulseRate: 0.5,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Pulse of the Unseen</h1>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your surroundings"
        style={{ width: '80%', padding: '10px', fontSize: '16px', marginBottom: '10px' }}
      />
      <button
        onClick={handleSubmit}
        style={{ padding: '10px', fontSize: '16px' }}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Generate Pulse'}
      </button>
      {isLoading && <p>Loading...</p>}
      {pulseData && (
        <div>
          <p style={{ fontSize: '18px', marginTop: '20px' }}>{pulseData.phrase}</p>
          <PulseVisualization color={pulseData.color} pulseRate={pulseData.pulseRate} />
        </div>
      )}
    </div>
  );
}