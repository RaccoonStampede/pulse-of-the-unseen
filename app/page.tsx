"use client"; // This tells Next.js this is a client-side component

import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

// Define the props type for TypeScript
interface PulseVisualizationProps {
  color?: string;
  pulseRate?: number;
  audioData?: {
    intensity: number;
    soundType: 'sharp' | 'rhythmic' | 'chaotic' | 'ambient' | 'sorrowful';
    highFreqEnergy: number;
    lowFreqEnergy: number;
    rhythmScore: number;
  }; // Expanded audio data for visualization
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
    const geometry = new THREE.SphereGeometry(1, 16, 16);
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
        const { intensity, soundType, highFreqEnergy, lowFreqEnergy, rhythmScore } = audioData;

        // Base scale adjustment
        let scale = 1 + intensity * 0.5 + Math.sin(time) * 0.2;
        sphere.scale.set(scale, scale, scale);

        // Default rotation
        sphere.rotation.y += intensity * 0.02;

        // Visual effects based on sound type
        switch (soundType) {
          case 'sharp':
            // Sharp, high-pitched sounds: Rapid, jagged scaling and bright colors
            sphere.scale.x = scale + Math.sin(time * 5) * 0.3;
            sphere.scale.z = scale - Math.sin(time * 5) * 0.3;
            material.color.set(`rgb(${255 * highFreqEnergy}, 50, 150)`); // Bright red for sharpness
            break;
          case 'rhythmic':
            // Rhythmic sounds: Pulsing in sync with rhythm, vibrant colors
            sphere.scale.setScalar(scale + Math.sin(time * rhythmScore * 2) * 0.4);
            material.color.set(`rgb(100, ${255 * rhythmScore}, 200)`); // Greenish for rhythm
            break;
          case 'chaotic':
            // Chaotic sounds: Erratic scaling and rotation, dark colors
            sphere.scale.x = scale + Math.random() * 0.5;
            sphere.scale.y = scale - Math.random() * 0.5;
            sphere.rotation.x += intensity * 0.05;
            material.color.set(`rgb(150, 50, ${255 * intensity})`); // Dark blue/purple for chaos
            break;
          case 'ambient':
            // Ambient sounds: Smooth, slow pulsing, soft colors
            sphere.scale.setScalar(scale + Math.sin(time * 0.5) * 0.2);
            material.color.set(`rgb(100, 150, ${200 * (1 - intensity)})`); // Soft blue for ambiance
            break;
          case 'sorrowful':
            // Sorrowful sounds: Slow, deep pulsing, blue hues
            sphere.scale.setScalar(scale + Math.sin(time * 0.3) * 0.1);
            material.color.set(`rgb(50, 50, ${255 * lowFreqEnergy})`); // Deep blue for sorrow
            break;
          default:
            material.color.set(color || '#00ff00');
        }
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
  const [audioData, setAudioData] = useState<{
    intensity: number;
    soundType: 'sharp' | 'rhythmic' | 'chaotic' | 'ambient' | 'sorrowful';
    highFreqEnergy: number;
    lowFreqEnergy: number;
    rhythmScore: number;
  } | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const intensityHistoryRef = useRef<number[]>([]); // For rhythm detection

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

          // Calculate overall intensity
          const avgFrequency = dataArrayRef.current.reduce((sum, val) => sum + val, 0) / dataArrayRef.current.length;
          const intensity = avgFrequency / 255; // Normalize to 0-1

          // Calculate frequency energies
          const lowFreqEnergy = dataArrayRef.current.slice(0, 10).reduce((sum, val) => sum + val, 0) / (10 * 255); // Low frequencies
          const highFreqEnergy = dataArrayRef.current.slice(-10).reduce((sum, val) => sum + val, 0) / (10 * 255); // High frequencies

          // Detect rhythm by tracking intensity changes over time
          intensityHistoryRef.current.push(intensity);
          if (intensityHistoryRef.current.length > 30) intensityHistoryRef.current.shift(); // Keep last 30 frames
          const rhythmScore = detectRhythm(intensityHistoryRef.current);

          // Determine sound type
          let soundType: 'sharp' | 'rhythmic' | 'chaotic' | 'ambient' | 'sorrowful';
          if (highFreqEnergy > 0.7 && intensity > 0.5) {
            soundType = 'sharp'; // High-pitched, intense sounds
          } else if (rhythmScore > 0.6) {
            soundType = 'rhythmic'; // Regular intensity changes
          } else if (intensity > 0.8 && highFreqEnergy > 0.5 && lowFreqEnergy > 0.5) {
            soundType = 'chaotic'; // High intensity across frequencies
          } else if (lowFreqEnergy > 0.6 && intensity < 0.4) {
            soundType = 'sorrowful'; // Low frequencies, low intensity
          } else {
            soundType = 'ambient'; // Default for other sounds
          }

          setAudioData({ intensity, soundType, highFreqEnergy, lowFreqEnergy, rhythmScore });
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
    intensityHistoryRef.current = [];
    setIsListening(false);
    setAudioData(null); // Reset audio data
  };

  // Helper function to detect rhythm
  const detectRhythm = (history: number[]): number => {
    if (history.length < 10) return 0;
    let peaks = 0;
    for (let i = 1; i < history.length - 1; i++) {
      if (history[i] > history[i - 1] && history[i] > history[i + 1] && history[i] > 0.5) {
        peaks++;
      }
    }
    return peaks / (history.length / 2); // Normalize to 0-1
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