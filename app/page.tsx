"use client"; // This tells Next.js this is a client-side component

import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

// Define the props type for TypeScript
interface PulseVisualizationProps {
  color?: string;
  pulseRate?: number;
  audioData?: { intensity: number; sorrowFactor: number }; // Add audio data for visualization
}

// Component for the pulsing visualization
const PulseVisualization: React.FC<PulseVisualizationProps> = ({ color, pulseRate, audioData }) => {
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create a sphere with a wireframe for an alien-like effect
    const geometry = new THREE.SphereGeometry(1, 16, 16); // Simple sphere for performance
    const material = new THREE.MeshBasicMaterial({
      color: color || '#00ff00',
      wireframe: true, // Alien-like wireframe look
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    camera.position.z = 5;

    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      const rate = pulseRate || 0.5;

      if (audioData && audioData.intensity > 0) {
        // Adjust scale based on audio intensity
        const scale = 1 + audioData.intensity * 0.5 + Math.sin(time) * 0.2;
        sphere.scale.set(scale, scale, scale);

        // Rotate for an alien-like effect based on intensity
        sphere.rotation.y += audioData.intensity * 0.02;

        // Adjust color for sorrowful tones (low frequencies amplify blue hues)
        const r = Math.min(255, 100 + audioData.intensity * 155);
        const g = 50; // Keep green low for an eerie feel
        const b = Math.min(255, 150 + audioData.sorrowFactor * 105); // Blue intensifies with sorrowful tones
        material.color.set(`rgb(${r}, ${g}, ${b})`);
      } else {
        // Default pulsing without audio
        sphere.scale.x = 1 + Math.sin(time * rate) * 0.5;
        sphere.scale.y = 1 + Math.sin(time * rate) * 0.5;
        sphere.scale.z = 1 + Math.sin(time * rate) * 0.5;
        material.color.set(color || '#00ff00');
      }

      time += 0.05;
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on component unmount
    return () => {
      document.body.removeChild(renderer.domElement);
    };
  }, [color, pulseRate, audioData]);

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
  const [isListening, setIsListening] = useState(false);
  const [audioData, setAudioData] = useState<{ intensity: number; sorrowFactor: number } | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Start listening to microphone
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      source.connect(analyser);

      // Store references for use in animation loop
      audioContextRef.current = audioContext;
      sourceRef.current = source;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      setIsListening(true);

      // Start analyzing audio
      const analyzeAudio = () => {
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          const avgFrequency = dataArrayRef.current.reduce((sum, val) => sum + val, 0) / dataArrayRef.current.length;
          const intensity = avgFrequency / 255; // Normalize to 0-1
          const sorrowFactor = dataArrayRef.current.slice(0, 10).reduce((sum, val) => sum + val, 0) / (10 * 255); // Focus on low frequencies
          setAudioData({ intensity, sorrowFactor });
          requestAnimationFrame(analyzeAudio);
        }
      };
      analyzeAudio();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsListening(false);
    }
  };

  // Stop listening to microphone
  const stopListening = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
    setIsListening(false);
    setAudioData(null); // Reset audio data
  };

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
        style={{ padding: '10px', fontSize: '16px', marginRight: '10px' }}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Generate Pulse'}
      </button>
      <button
        onClick={isListening ? stopListening : startListening}
        style={{ padding: '10px', fontSize: '16px' }}
      >
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      {isLoading && <p>Loading...</p>}
      {pulseData && (
        <div>
          <p style={{ fontSize: '18px', marginTop: '20px' }}>{pulseData.phrase}</p>
          <PulseVisualization
            color={pulseData.color}
            pulseRate={pulseData.pulseRate}
            audioData={audioData}
          />
        </div>
      )}
    </div>
  );
}