/**
 * use3DModel Hook
 * Provides loading state management for 3D models
 */

import { useState, useEffect } from 'react';
import { getCachedModel, cacheModel } from '../components/3d/utils/modelLoader';

/**
 * Hook for managing 3D model loading states
 * @param {string|null} modelUrl - URL of the model to load
 * @returns {{ scene: any, loading: boolean, error: string|null }}
 */
export function use3DModel(modelUrl) {
  const [scene, setScene] = useState(null);
  const [loading, setLoading] = useState(Boolean(modelUrl));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const createProceduralFallback = async () => {
      const THREE = await import('three');
      const group = new THREE.Group();
      const geometry = new THREE.SphereGeometry(0.65, 28, 28);
      const material = new THREE.MeshStandardMaterial({
        color: '#00e5ff',
        emissive: '#012a35',
        roughness: 0.6,
        metalness: 0.25,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
      return group;
    }

    const load = async () => {
      try {
        const fallback = await createProceduralFallback();
        if (!active) return;
        setScene(fallback);

        if (!modelUrl) {
          setLoading(false);
          setError(null);
          return;
        }

        const cached = getCachedModel(modelUrl);
        if (cached) {
          setScene(cached);
          setLoading(false);
          setError(null);
          return;
        }

        setLoading(true);
        setError(null);

        const [{ GLTFLoader }] = await Promise.all([
          import('three/examples/jsm/loaders/GLTFLoader.js'),
        ]);

        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf) => {
            if (!active) return;
            const loadedScene = gltf?.scene || fallback;
            cacheModel(modelUrl, loadedScene);
            setScene(loadedScene);
            setLoading(false);
            setError(null);
          },
          undefined,
          () => {
            if (!active) return;
            setScene(fallback);
            setLoading(false);
            setError('Failed to load GLTF model. Using procedural fallback.');
          }
        );
      } catch {
        if (!active) return;
        setLoading(false);
        setError('Failed to initialize model loader.');
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [modelUrl]);

  return { scene, loading, error };
}
