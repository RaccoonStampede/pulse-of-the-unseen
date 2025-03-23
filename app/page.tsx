"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

// Define the structure of your audio data
interface AudioData {
  intensity: number; // Volume level (0 to 1)
  soundType: 'ambient' | 'rhythmic' | 'sharp' | 'chaotic' | 'sorrowful'; // Sound categories
  highFreqEnergy: number;
  lowFreqEnergy: number;
  rhythmScore: number;
}

interface PulseVisualizationProps {
  color?: string; // Optional base color
  pulseRate?: number; // Optional pulse speed
  audioData?: AudioData | null; // Audio data to drive the visualization
}

const PulseVisualization: React.FC<PulseVisualizationProps> = ({ color, pulseRate, audioData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const ribbonsRef = useRef<THREE.Line[]>([]);
  const dotsRef = useRef<THREE.Points | null>(null);
  const webRef = useRef<THREE.Line | null>(null);
  const liquidRef = useRef<THREE.Mesh | null>(null);
  const noise = createNoise3D(); // Noise function for organic effects
  const animationFrameIdRef = useRef<number | null>(null);
  const timeRef = useRef(0); // Track time for animations

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
      // Connect points to form a web
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
      const material = new THREE.MeshPhongMaterial({ color: 0x0000ff, side: THREE.DoubleSide, shininess: 100 });
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

        // **Simulate Grok's Control Logic**
        const grokShapeControl = (soundType: string) => {
          switch (soundType) {
            case 'ambient': // e.g., Rain
              return {
                ribbonSpeed: 2 * intensity,
                dotSwarm: 0.1 * intensity,
                webPulse: 0.5 * intensity,
                liquidFlow: 0.2 * intensity,
                baseColor: 0x0000ff, // Blue
              };
            case 'rhythmic': // e.g., Nature
              return {
                ribbonSpeed: 1 * intensity,
                dotSwarm: 0.3 * rhythmScore,
                webPulse: 1 * rhythmScore,
                liquidFlow: 0.1 * intensity,
                baseColor: 0x00ff00, // Green
              };
            case 'sharp': // e.g., Sudden noises
              return {
                ribbonSpeed: 3 * intensity,
                dotSwarm: 0.5 * intensity,
                webPulse: 2 * intensity,
                liquidFlow: 0.05 * intensity,
                baseColor: 0xff0000, // Red
              };
            case 'chaotic': // e.g., Erratic sounds
              return {
                ribbonSpeed: 4 * intensity,
                dotSwarm: 1 * intensity,
                webPulse: 3 * intensity,
                liquidFlow: 0.3 * intensity,
                baseColor: 0xff00ff, // Magenta
              };
            case 'sorrowful': // e.g., Sad tones
              return {
                ribbonSpeed: 0.5 * intensity,
                dotSwarm: 0.05 * intensity,
                webPulse: 0.2 * intensity,
                liquidFlow: 0.1 * intensity,
                baseColor: 0x000088, // Deep blue
              };
            default:
              return {
                ribbonSpeed: 1,
                dotSwarm: 0.1,
                webPulse: 0.5,
                liquidFlow: 0.1,
                baseColor: 0x00ff00,
              };
          }
        };

        const control = grokShapeControl(soundType);

        // **Animate Ribbons**
        ribbonsRef.current.forEach((ribbon, i) => {
          const positions = ribbon.geometry.attributes.position.array as Float32Array;
          for (let j = 0; j < positions.length / 3; j++) {
            const x = positions[j * 3];
            const offset = (j / (positions.length / 3)) * Math.PI;
            positions[j * 3 + 1] = Math.sin(offset + timeRef.current * control.ribbonSpeed) * 2;
            positions[j * 3 + 2] = Math.cos(offset + timeRef.current * control.ribbonSpeed) * 2;
          }
          ribbon.geometry.attributes.position.needsUpdate = true;
          (ribbon.material as THREE.LineBasicMaterial).color.set(control.baseColor);
        });

        // **Animate Dots**
        if (dotsRef.current) {
          const positions = dotsRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < positions.length / 3; i++) {
            positions[i * 3] += (Math.sin(timeRef.current + i) * control.dotSwarm);
            positions[i * 3 + 1] += (Math.cos(timeRef.current + i) * control.dotSwarm);
            positions[i * 3 + 2] += (Math.sin(timeRef.current + i) * control.dotSwarm);
            // Keep dots within bounds
            positions[i * 3] = THREE.MathUtils.clamp(positions[i * 3], -5, 5);
            positions[i * 3 + 1] = THREE.MathUtils.clamp(positions[i * 3 + 1], -5, 5);
            positions[i * 3 + 2] = THREE.MathUtils.clamp(positions[i * 3 + 2], -5, 5);
          }
          dotsRef.current.geometry.attributes.position.needsUpdate = true;
          (dotsRef.current.material as THREE.PointsMaterial).color.set(control.baseColor);
        }

        // **Animate Web**
        if (webRef.current) {
          const positions = webRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < positions.length / 3; i++) {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const z = positions[i * 3 + 2];
            const offset = Math.sin(timeRef.current * control.webPulse + i) * 0.5;
            positions[i * 3 + 2] = z + offset;
          }
          webRef.current.geometry.attributes.position.needsUpdate = true;
          (webRef.current.material as THREE.LineBasicMaterial).color.set(control.baseColor);
        }

        // **Animate Liquid**
        if (liquidRef.current) {
          const geometry = liquidRef.current.geometry as THREE.PlaneGeometry;
          const positions = geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < positions.length / 3; i++) {
            const x = positions[i * 3];
            const y = positions[i * 3 + 1];
            const distance = Math.sqrt(x * x + y * y);
            const wave = Math.sin(distance * 5 - timeRef.current * control.liquidFlow) * intensity;
            positions[i * 3 + 2] = wave;
          }
          geometry.attributes.position.needsUpdate = true;
          (liquidRef.current.material as THREE.MeshPhongMaterial).color.set(control.baseColor);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // **Cleanup**
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
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
  }, [color, pulseRate, audioData]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '500px', background: 'black' }} />;
};

export default PulseVisualization;