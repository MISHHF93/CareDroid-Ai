/**
 * use3DModel Hook
 * Provides loading state management for 3D models
 */

import { useState, useEffect, useRef } from 'react';
import { getCachedModel, cacheModel } from '../components/3d/utils/modelLoader';

/**
 * Hook for managing 3D model loading states
 * @param {string|null} modelUrl - URL of the model to track
 * @returns {{ loading: boolean, error: string|null, loaded: boolean }}
 */
export function use3DModel(modelUrl) {
  const [loading, setLoading] = useState(!!modelUrl);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(() => !!modelUrl && !!getCachedModel(modelUrl));
  const urlRef = useRef(modelUrl);

  useEffect(() => {
    if (!modelUrl) {
      setLoading(false);
      setLoaded(false);
      setError(null);
      return;
    }

    if (getCachedModel(modelUrl)) {
      setLoading(false);
      setLoaded(true);
      return;
    }

    setLoading(true);
    setError(null);
    setLoaded(false);
    urlRef.current = modelUrl;
  }, [modelUrl]);

  /**
   * Call this when a model has finished loading successfully
   * @param {any} modelData - The loaded model data
   */
  function onModelLoaded(modelData) {
    if (urlRef.current) {
      cacheModel(urlRef.current, modelData);
    }
    setLoading(false);
    setLoaded(true);
    setError(null);
  }

  /**
   * Call this when a model fails to load
   * @param {string} message - Error message
   */
  function onModelError(message) {
    setLoading(false);
    setLoaded(false);
    setError(message || 'Failed to load 3D model');
  }

  return { loading, error, loaded, onModelLoaded, onModelError };
}
