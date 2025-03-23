"use client"; // This tells Next.js this is a client-side component

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import Sentiment from 'sentiment';

// Define the audio data type
interface AudioData {
  intensity: number;
  soundType: 'sharp' | 'rhythmic' | 'chaotic' | 'ambient' | 'sorrowful';
  highFreqEnergy: number;
  lowFreqEnergy: number;
  rhythmScore: number;
}

// Define the props type for PulseVisualization
interface PulseVisualizationProps {
  color?: string;
  pulseRate?: number;
  audioData?: AudioData | null;
  phrase?: string; // Added to influence visualization based on Grok's response
}

// Component for the pulsing visualization
const PulseVisualization: React.FC<PulseVisualizationProps> = ({ color, pulseRate, audioData, phrase }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const ribbonsRef = useRef<THREE.Line[]>([]);
  const dotsRef = useRef<THREE.Points | null>(null);
  const webRef = useRef<THREE.Line | null>(null);
  const liquidRef = useRef<THREE.Mesh | null>(null);
  const noise = createNoise3D(); // Noise function for organic effects
  const animationFrameIdRef = useRef<number | null>(null);
  const timeRef = useRef(0); // Track time for animations
  const sentiment = new Sentiment();

  useEffect(() => {
    if (!canvasRef.current) return;

    // **Setup Three.js Scene**
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current = renderer;

    // **Post-Processing for Glow**
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // **Add Lighting**
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // **Ribbons (Flowing Tendrils)**
    const createRibbons = () => {
      const ribbonCount = 5;
      for (let i = 0; i < ribbonCount; i++) {
        const points = [];
        const segments = 20;
        for (let j = 0; j < segments; j++) {
          const x = (j / segments - 0.5) * 10;
          const y = Math.sin((j / segments) * Math.PI) * 2;
          const z = 0;
          points.push(new THREE.Vector3(x, y, z));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const ribbon = new THREE.Line(geometry, material);
        ribbonsRef.current.push(ribbon);
        scene.add(ribbon);
      }
    };

    // **Dots (Swarming Particles)**
    const createDots = () => {
      const particleCount = 100;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
      const dots = new THREE.Points(geometry, material);
      dots.userData.velocities = new Float32Array(particleCount * 3); // For flocking
      dotsRef.current = dots;
      scene.add(dots);
    };

    // **Web (Interconnected Threads)**
    const createWeb = () => {
      const points = [];
      const webPoints = 20;
      for (let i = 0; i < webPoints; i++) {
        const angle = (i / webPoints) * Math.PI * 2;
        const radius = 3 + Math.random() * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
      }
      const webGeometry = new THREE.BufferGeometry();
      const vertices = [];
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          vertices.push(points[i].x, points[i].y, points[i].z);
          vertices.push(points[j].x, points[j].y, points[j].z);
        }
      }
      webGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      const webMaterial = new THREE.LineBasicMaterial({ color: 0x8888ff });
      const web = new THREE.LineSegments(webGeometry, webMaterial);
      webRef.current = web;
      scene.add(web);
    };

    // **Liquid (Fluid Surface)**
    const createLiquid = () => {
      const geometry = new THREE.PlaneGeometry(10, 10, 32, 32);
      const material = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, amplitude: { value: 0.1 } },
        vertexShader: `
          uniform float time;
          uniform float amplitude;
          void main() {
            vec3 pos = position;
            pos.z += sin(pos.x * 5.0 + time) * amplitude + cos(pos.y * 5.0 + time) * amplitude;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          void main() {
            gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0); // Blue
          }
        `,
        side: THREE.DoubleSide
      });
      const liquid = new THREE.Mesh(geometry, material);
      liquid.rotation.x = -Math.PI / 2;
      liquid.position.y = -2;
      scene.add(liquid);
      liquidRef.current = liquid;
    };

    // Initialize all elements
    createRibbons();
    createDots();
    createWeb();
    createLiquid();

    // **Animation Loop**
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.05;

      if (audioData && audioData.intensity > 0) {
        const { intensity, soundType, rhythmScore } = audioData;

        // **Simulate Grok's Control Logic, Enhanced with Phrase and Sentiment**
        const grokShapeControl = (soundType: string, phrase?: string) => {
          let control = {
            ribbonSpeed: 1 * intensity,
            dotSwarm: 0.1 * intensity,
            webPulse: 0.5 * intensity,
            liquidFlow: 0.1 * intensity,
            baseColor: 0x00ff00,
            glowIntensity: 1.0
          };

          switch (soundType) {
            case 'ambient':
              control = { ...control, ribbonSpeed: 2 * intensity, liquidFlow: 0.2 * intensity, baseColor: 0x0000ff };
              break;
            case 'rhythmic':
              control = { ...control, dotSwarm: 0.3 * rhythmScore, webPulse: 1 * rhythmScore, baseColor: 0x00ff00 };
              break;
            case 'sharp':
              control = { ...control, ribbonSpeed: 3 * intensity, dotSwarm: 0.5 * intensity, webPulse: 2 * intensity, baseColor: 0xff0000 };
              break;
            case 'chaotic':
              control = { ...control, ribbonSpeed: 4 * intensity, dotSwarm: 1 * intensity, webPulse: 3 * intensity, liquidFlow: 0.3 * intensity, baseColor: 0xff00ff };
              break;
            case 'sorrowful':
              control = { ...control, ribbonSpeed: 0.5 * intensity, dotSwarm: 0.05 * intensity, webPulse: 0.2 * intensity, baseColor: 0x000088 };
              break;
          }

          if (phrase) {
            const lowerPhrase = phrase.toLowerCase();
            const sentimentAnalysis = sentiment.analyze(phrase);
            if (sentimentAnalysis.score > 0) control.baseColor = 0xffff00; // Positive
            else if (sentimentAnalysis.score < 0) control.baseColor = 0x000088; // Negative

            if (lowerPhrase.includes('ethereal') || lowerPhrase.includes('spirit')) {
              control.ribbonSpeed *= 1.5;
              control.glowIntensity = 2.0;
              control.baseColor = 0x88ccff;
            } else if (lowerPhrase.includes('dark') || lowerPhrase.includes('shadow')) {
              control.webPulse *= 2;
              control.baseColor = 0x440044;
            } else if (lowerPhrase.includes('echo') || lowerPhrase.includes('resonance')) {
              control.liquidFlow *= 1.5;
              control.baseColor = 0x00aaff;
            }
          }

          return control;
        };

        const control = grokShapeControl(soundType, phrase);

        // **Animate Ribbons with Noise**
        ribbonsRef.current.forEach((ribbon, i) => {
          const positions = ribbon.geometry.attributes.position.array as Float32Array;
          for (let j = 0; j < positions.length / 3; j++) {
            const x = positions[j * 3];
            const time = timeRef.current * control.ribbonSpeed;
            positions[j * 3 + 1] = noise(x * 0.1, time, i) * 2;
            positions[j * 3 + 2] = noise(x * 0.1, time + 100, i) * 2;
          }
          ribbon.geometry.attributes.position.needsUpdate = true;
          (ribbon.material as THREE.LineBasicMaterial).color.set(control.baseColor);
        });

        // **Animate Dots with Flocking**
        if (dotsRef.current) {
          const positions = dotsRef.current.geometry.attributes.position.array as Float32Array;
          const velocities = dotsRef.current.userData.velocities as Float32Array;
          for (let i = 0; i < positions.length / 3; i++) {
            velocities[i * 3] += (Math.random() - 0.5) * control.dotSwarm;
            velocities[i * 3 + 1] += (Math.random() - 0.5) * control.dotSwarm;
            velocities[i * 3 + 2] += (Math.random() - 0.5) * control.dotSwarm;

            positions[i * 3] += velocities[i * 3];
            positions[i * 3 + 1] += velocities[i * 3 + 1];
            positions[i * 3 + 2] += velocities[i * 3 + 2];

            positions[i * 3] = THREE.MathUtils.clamp(positions[i * 3], -5, 5);
            positions[i * 3 + 1] = THREE.MathUtils.clamp(positions[i * 3 + 1], -5, 5);
            positions[i * 3 + 2] = THREE.MathUtils.clamp(positions[i * 3 + 2], -5, 5);
          }
          dotsRef.current.geometry.attributes.position.needsUpdate = true;
          (dotsRef.current.material as THREE.PointsMaterial).color.set(control.baseColor);
        }

        // **Animate Web with Glow**
        if (webRef.current) {
          const positions = webRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < positions.length / 3; i++) {
            const offset = Math.sin(timeRef.current * control.webPulse + i) * 0.5;
            positions[i * 3 + 2] = offset;
          }
          webRef.current.geometry.attributes.position.needsUpdate = true;
          (webRef.current.material as THREE.LineBasicMaterial).color.set(control.baseColor);
          bloomPass.strength = control.glowIntensity;
        }

        // **Animate Liquid with Shader**
        if (liquidRef.current) {
          const material = liquidRef.current.material as THREE.ShaderMaterial;
          material.uniforms.time.value = timeRef.current;
          material.uniforms.amplitude.value = control.liquidFlow;
          (liquidRef.current.material as THREE.ShaderMaterial).needsUpdate = true;
        }
      }

      composerRef.current?.render(); // Use composer for glow effect
    };
    animate();

    // **Cleanup**
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
      if (composerRef.current) composerRef.current.dispose();
      if (sceneRef.current) {
        sceneRef.current.children.forEach(child => {
          if (child instanceof THREE.Line || child instanceof THREE.Points || child instanceof THREE.Mesh) {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          }
        });
        sceneRef.current.clear();
      }
    };
  }, [color, pulseRate, audioData, phrase]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '500px', background: 'black' }} />;
};

// Define the pulse data type
interface PulseData {
  phrase: string;
  color: string;
  pulseRate: number;
  error?: string;
  errorDetails?: string;
}

// Main page component (unchanged for now)
export default function Home() {
  const [description, setDescription] = useState<string>('');
  const [pulseData, setPulseData] = useState<PulseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState(false);
  const [audioData, setAudioData] = useState<AudioData | null>(null);
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

      audioContextRef.current = audioContext;
      sourceRef.current = source;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      setIsListening(true);

      const analyzeAudio = () => {
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);

          const avgFrequency = dataArrayRef.current.reduce((sum, val) => sum + val, 0) / dataArrayRef.current.length;
          const intensity = avgFrequency / 255;
          const lowFreqEnergy = dataArrayRef.current.slice(0, 10).reduce((sum, val) => sum + val, 0) / (10 * 255);
          const highFreqEnergy = dataArrayRef.current.slice(-10).reduce((sum, val) => sum + val, 0) / (10 * 255);

          intensityHistoryRef.current.push(intensity);
          if (intensityHistoryRef.current.length > 30) intensityHistoryRef.current.shift();
          const rhythmScore = detectRhythm(intensityHistoryRef.current);

          let soundType: 'sharp' | 'rhythmic' | 'chaotic' | 'ambient' | 'sorrowful';
          if (highFreqEnergy > 0.7 && intensity > 0.5) soundType = 'sharp';
          else if (rhythmScore > 0.6) soundType = 'rhythmic';
          else if (intensity > 0.8 && highFreqEnergy > 0.5 && lowFreqEnergy > 0.5) soundType = 'chaotic';
          else if (lowFreqEnergy > 0.6 && intensity < 0.4) soundType = 'sorrowful';
          else soundType = 'ambient';

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
    setAudioData(null);
  };

  const detectRhythm = (history: number[]): number => {
    if (history.length < 10) return 0;
    let peaks = 0;
    for (let i = 1; i < history.length - 1; i++) {
      if (history[i] > history[i - 1] && history[i] > history[i + 1] && history[i] > 0.5) {
        peaks++;
      }
    }
    return peaks / (history.length / 2);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setPulseData({
        phrase: 'Please enter a description',
        color: '#ff0000',
        pulseRate: 0.5,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      const data: PulseData = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pulse data');
      }
      setPulseData(data);
    } catch (error: any) {
      console.error('Error fetching pulse data:', error);
      setPulseData({
        phrase: error.message || 'Error generating pulse',
        color: '#ff0000',
        pulseRate: 0.5,
        error: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', background: 'black', color: 'white', minHeight: '100vh' }}>
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
          <p style={{ fontSize: '18px', marginTop: '20px' }}>
            {pulseData.error ? `Error: ${pulseData.error}` : pulseData.phrase}
          </p>
          <PulseVisualization
            color={pulseData.color}
            pulseRate={pulseData.pulseRate}
            audioData={audioData}
            phrase={pulseData.phrase}
          />
        </div>
      )}
    </div>
  );
}