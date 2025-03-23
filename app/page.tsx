"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface AudioData {
  intensity: number;
  soundType: 'sharp' | 'rhythmic' | 'chaotic' | 'ambient' | 'sorrowful';
  highFreqEnergy: number;
  lowFreqEnergy: number;
  rhythmScore: number;
}

interface PulseVisualizationProps {
  color?: string;
  pulseRate?: number;
  audioData?: AudioData | null;
}

const PulseVisualization: React.FC<PulseVisualizationProps> = ({ color, pulseRate, audioData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshesRef = useRef<THREE.InstancedMesh[]>([]);
  const positionsRef = useRef<THREE.Vector3[][]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Set up Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current = renderer;

    camera.position.z = 8;

    // Define multiple shape types
    const instanceCount = 50; // Number of instances per shape type
    const shapeTypes = [
      { geometry: new THREE.TetrahedronGeometry(0.1), color: 0xffffff }, // Sharp, angular
      { geometry: new THREE.SphereGeometry(0.1, 16, 16), color: 0x88ccff }, // Soft, round
      { geometry: new THREE.BoxGeometry(0.1, 0.1, 0.1), color: 0x00ff00 }, // Structured
    ];

    // Create instanced meshes for each shape type
    meshesRef.current = shapeTypes.map(({ geometry, color }) => {
      const material = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.InstancedMesh(geometry, material, instanceCount);
      scene.add(mesh);
      return mesh;
    });

    // Initialize positions for each shape type
    positionsRef.current = shapeTypes.map(() =>
      Array.from({ length: instanceCount }, () => new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      ))
    );

    let time = 0;

    // Animation loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      time += 0.05;

      if (audioData && audioData.intensity > 0 && meshesRef.current.length) {
        const { intensity, soundType, rhythmScore } = audioData;
        const dummy = new THREE.Object3D();

        meshesRef.current.forEach((mesh, shapeIndex) => {
          const positions = positionsRef.current[shapeIndex];

          for (let i = 0; i < instanceCount; i++) {
            const pos = positions[i];

            // Update position and scale based on sound type
            switch (soundType) {
              case 'ambient':
                // Fall like rain or drifting particles
                pos.y -= 0.05 * (1 + intensity) * (shapeIndex + 1) * 0.5;
                if (pos.y < -5) pos.y = 5;
                break;
              case 'rhythmic':
                // Pulse in size or sway with rhythm
                const scale = 1 + Math.sin(time * rhythmScore * 2 + shapeIndex) * 0.5 * intensity;
                dummy.scale.setScalar(scale);
                pos.x += Math.cos(time + i) * 0.02 * rhythmScore;
                break;
              case 'sharp':
                // Erratic, fast movements
                pos.x += (Math.random() - 0.5) * 0.3 * intensity;
                pos.y += (Math.random() - 0.5) * 0.3 * intensity;
                pos.z += (Math.random() - 0.5) * 0.3 * intensity;
                break;
              case 'chaotic':
                // Scatter and regroup
                pos.x += Math.sin(time + i + shapeIndex) * 0.15 * intensity;
                pos.y += Math.cos(time + i + shapeIndex) * 0.15 * intensity;
                break;
              case 'sorrowful':
                // Slow descent
                pos.y -= 0.03 * (1 + intensity) * (shapeIndex + 1) * 0.5;
                if (pos.y < -5) pos.y = 5;
                dummy.scale.setScalar(1 - intensity * 0.5); // Shrink over time
                break;
            }

            dummy.position.copy(pos);

            // Adjust color dynamically
            const material = mesh.material as THREE.MeshBasicMaterial;
            switch (soundType) {
              case 'ambient':
                material.color.set(0x88ccff); // Light blue
                break;
              case 'rhythmic':
                material.color.set(0x00ff00); // Green
                break;
              case 'sharp':
                material.color.set(0xff0000); // Red
                break;
              case 'chaotic':
                material.color.set(0xff00ff); // Magenta
                break;
              case 'sorrowful':
                material.color.set(0x0000ff); // Deep blue
                break;
              default:
                material.color.set(color || '#00ff00');
            }

            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
          }
          mesh.instanceMatrix.needsUpdate = true;
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
      if (sceneRef.current) {
        sceneRef.current.children.forEach(child => {
          if (child instanceof THREE.InstancedMesh) {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          }
        });
        sceneRef.current.clear();
      }
    };
  }, [color, pulseRate, audioData]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '500px' }} />;
};

export default PulseVisualization;