import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { getTextureStreamingService } from '../../../services/realtime/TextureStreamingService';

function estimateTextureBytes(texture) {
  const img = texture?.image;
  if (!img?.width || !img?.height) return 0;
  return img.width * img.height * 4;
}

function estimateGeometryBytes(geometry) {
  if (!geometry?.attributes) return 0;
  return Object.values(geometry.attributes).reduce((sum, attr) => sum + (attr?.array?.byteLength || 0), 0);
}

function getQualityFromFps(fps) {
  if (fps < 26) return 'low';
  if (fps < 40) return 'medium';
  return 'high';
}

function createSimpleMaterialFrom(material) {
  const color = material?.color?.clone?.() || new THREE.Color('#93c5fd');
  return new THREE.MeshLambertMaterial({ color, transparent: Boolean(material?.transparent), opacity: material?.opacity ?? 1 });
}

export default function AdaptiveQualityController({
  enabled = false,
  rootGroupRef,
  controlsRef,
  tier = 'medium',
  onDprChange,
  onQualityLevelChange,
  onGpuStats,
}) {
  const { camera, size, gl, scene } = useThree();
  const fpsWindow = useRef([]);
  const cullFrustum = useMemo(() => new THREE.Frustum(), []);
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const clockRef = useRef(0);
  const qualityRef = useRef('high');
  const dprRef = useRef(1);
  const textureService = useMemo(() => getTextureStreamingService(), []);
  const registeredTexturesRef = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;
    textureService.initialize(gl);
    return () => {
      textureService.dispose();
    };
  }, [enabled, gl, textureService]);

  useFrame((_, delta) => {
    if (!enabled || !rootGroupRef?.current) return;

    fpsWindow.current.push(1 / Math.max(delta, 1e-5));
    if (fpsWindow.current.length > 45) fpsWindow.current.shift();

    const avgFps = fpsWindow.current.reduce((sum, n) => sum + n, 0) / Math.max(1, fpsWindow.current.length);
    const nextQuality = getQualityFromFps(avgFps);

    if (nextQuality !== qualityRef.current) {
      qualityRef.current = nextQuality;
      onQualityLevelChange?.(nextQuality);

      rootGroupRef.current.traverse((node) => {
        if (!node?.isMesh || !node.material) return;

        if (nextQuality === 'low') {
          if (!node.userData.__originalMaterial) {
            node.userData.__originalMaterial = node.material;
            node.material = createSimpleMaterialFrom(node.material);
          }
        } else if (node.userData.__originalMaterial) {
          node.material.dispose?.();
          node.material = node.userData.__originalMaterial;
          delete node.userData.__originalMaterial;
        }
      });
    }

    let targetDpr = tier === 'high' ? 1.35 : tier === 'medium' ? 1.1 : 0.95;
    if (avgFps < 30) targetDpr *= 0.78;
    if (avgFps < 24) targetDpr *= 0.85;
    if (avgFps > 54 && qualityRef.current === 'high') targetDpr *= 1.08;
    targetDpr = Math.max(0.55, Math.min(targetDpr, 1.8));

    if (Math.abs(targetDpr - dprRef.current) > 0.04) {
      dprRef.current = targetDpr;
      onDprChange?.(targetDpr);
    }

    clockRef.current += delta;
    if (clockRef.current < 0.4) return;
    clockRef.current = 0;

    if (!registeredTexturesRef.current) {
      textureService.registerSceneMaterials(rootGroupRef.current, 3.1);
      registeredTexturesRef.current = true;
    }

    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    cullFrustum.setFromProjectionMatrix(projScreenMatrix);

    const potentialOccluders = [];
    rootGroupRef.current.traverse((node) => {
      if (node?.isMesh && node.visible && node.material?.opacity >= 0.98) {
        potentialOccluders.push(node);
      }
    });

    rootGroupRef.current.traverse((node) => {
      if (!node?.isMesh || !node.geometry) return;

      node.geometry.computeBoundingSphere?.();
      const sphere = node.geometry.boundingSphere?.clone();
      if (!sphere) return;
      sphere.applyMatrix4(node.matrixWorld);

      const inFrustum = cullFrustum.intersectsSphere(sphere);
      if (!inFrustum) {
        node.visible = false;
        return;
      }

      const direction = new THREE.Vector3().subVectors(sphere.center, camera.position).normalize();
      raycaster.set(camera.position, direction);
      raycaster.far = camera.position.distanceTo(sphere.center);
      const hits = raycaster.intersectObjects(potentialOccluders, true);
      const first = hits[0];
      const occluded = first && first.object !== node && first.distance < raycaster.far - sphere.radius * 0.65;
      node.visible = !occluded;
    });

    const gpuStats = { bytes: 0, textures: 0, geometries: 0 };
    scene.traverse((node) => {
      if (node?.isMesh) {
        if (node.geometry) {
          gpuStats.geometries += 1;
          gpuStats.bytes += estimateGeometryBytes(node.geometry);
        }
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((mat) => {
          if (!mat) return;
          const maps = [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap, mat.emissiveMap].filter(Boolean);
          maps.forEach((tex) => {
            gpuStats.textures += 1;
            gpuStats.bytes += estimateTextureBytes(tex);
          });
        });
      }
    });

    const bytesLimit = tier === 'high' ? 1100 * 1024 * 1024 : tier === 'medium' ? 800 * 1024 * 1024 : 540 * 1024 * 1024;
    if (gpuStats.bytes > bytesLimit) {
      const cameraPos = camera.position.clone();
      const candidates = [];
      rootGroupRef.current.traverse((node) => {
        if (!node?.isMesh || !node.material) return;
        const dist = node.getWorldPosition(new THREE.Vector3()).distanceTo(cameraPos);
        candidates.push({ node, dist });
      });

      candidates.sort((a, b) => b.dist - a.dist);
      const unloadCount = Math.max(1, Math.round(candidates.length * 0.1));
      candidates.slice(0, unloadCount).forEach(({ node }) => {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((mat) => {
          if (!mat || !mat.map) return;
          if (!mat.userData.__streamedOutMap) {
            mat.userData.__streamedOutMap = mat.map;
          }
          mat.map = null;
          mat.needsUpdate = true;
        });
      });
    } else {
      rootGroupRef.current.traverse((node) => {
        const mats = Array.isArray(node?.material) ? node.material : [node?.material];
        mats.forEach((mat) => {
          if (mat?.userData?.__streamedOutMap && !mat.map) {
            mat.map = mat.userData.__streamedOutMap;
            delete mat.userData.__streamedOutMap;
            mat.needsUpdate = true;
          }
        });
      });
    }

    onGpuStats?.(gpuStats);

    const distance = camera.position.length();
    textureService.streamForDistance(distance).catch(() => {
      // noop
    });
  });

  return null;
}
