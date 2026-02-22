import * as THREE from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

class TextureStreamingService {
  constructor() {
    this.loader = null;
    this.registry = new Map();
    this.renderer = null;
  }

  initialize(renderer) {
    if (!renderer || this.loader) return;
    this.renderer = renderer;
    this.loader = new KTX2Loader();
    this.loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis/');
    this.loader.detectSupport(renderer);
  }

  registerMaterialTexture({ key, material, lowResUrl, highResUrl, threshold = 3.2 }) {
    if (!key || !material) return;
    this.registry.set(key, {
      key,
      material,
      lowResUrl,
      highResUrl,
      threshold,
      current: null,
      loading: false,
    });
  }

  createLowResProxy(texture, targetSize = 256) {
    const img = texture?.image;
    if (!img?.width || !img?.height || typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    const aspect = img.width / Math.max(1, img.height);
    canvas.width = targetSize;
    canvas.height = Math.max(1, Math.round(targetSize / Math.max(aspect, 1e-4)));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const lowTexture = new THREE.CanvasTexture(canvas);
    lowTexture.needsUpdate = true;
    return lowTexture;
  }

  registerSceneMaterials(scene, threshold = 2.8) {
    if (!scene) return;
    scene.traverse((node) => {
      if (!node?.isMesh || !node.material) return;
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach((material, index) => {
        if (!material?.map) return;
        const key = `${node.uuid}-${index}`;
        if (this.registry.has(key)) return;

        const highTexture = material.map;
        const lowTexture = this.createLowResProxy(highTexture, 192);
        if (!lowTexture) return;

        this.registry.set(key, {
          key,
          material,
          threshold,
          current: 'high',
          loading: false,
          lowTexture,
          highTexture,
        });
      });
    });
  }

  async loadTexture(url) {
    if (!url) return null;
    if (!this.loader) return new THREE.TextureLoader().loadAsync(url);
    try {
      return await this.loader.loadAsync(url);
    } catch {
      return new THREE.TextureLoader().loadAsync(url);
    }
  }

  async streamForDistance(distance) {
    const updates = Array.from(this.registry.values()).map(async (entry) => {
      const wantHigh = distance <= entry.threshold;

      if (entry.highTexture && entry.lowTexture) {
        const target = wantHigh ? 'high' : 'low';
        if (entry.current === target) return;
        entry.material.map = target === 'high' ? entry.highTexture : entry.lowTexture;
        entry.material.needsUpdate = true;
        entry.current = target;
        return;
      }

      const targetUrl = wantHigh ? entry.highResUrl : entry.lowResUrl;
      if (!targetUrl || entry.loading || entry.current === targetUrl) return;

      entry.loading = true;
      try {
        const texture = await this.loadTexture(targetUrl);
        if (!texture) return;
        texture.anisotropy = 4;
        texture.needsUpdate = true;

        if (entry.material.map && entry.material.map !== texture) {
          entry.material.map.dispose?.();
        }

        entry.material.map = texture;
        entry.material.needsUpdate = true;
        entry.current = targetUrl;
      } finally {
        entry.loading = false;
      }
    });

    await Promise.allSettled(updates);
  }

  dispose() {
    if (this.loader) {
      this.loader.dispose();
      this.loader = null;
    }
    this.registry.forEach((entry) => {
      if (entry.lowTexture) entry.lowTexture.dispose?.();
    });
    this.registry.clear();
  }
}

let instance = null;

export function getTextureStreamingService() {
  if (!instance) {
    instance = new TextureStreamingService();
  }
  return instance;
}

export default TextureStreamingService;
