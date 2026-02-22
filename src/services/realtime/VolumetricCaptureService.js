import * as THREE from 'three';

function uid() {
  return `vol-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sampleMeshPoints(mesh, maxSamples = 120) {
  const geometry = mesh.geometry;
  if (!geometry?.attributes?.position) return [];

  const position = geometry.attributes.position;
  const step = Math.max(1, Math.floor(position.count / maxSamples));
  const world = mesh.matrixWorld;
  const vector = new THREE.Vector3();
  const points = [];

  for (let index = 0; index < position.count; index += step) {
    vector.fromBufferAttribute(position, index).applyMatrix4(world);
    points.push([Number(vector.x.toFixed(4)), Number(vector.y.toFixed(4)), Number(vector.z.toFixed(4))]);
    if (points.length >= maxSamples) break;
  }

  return points;
}

class VolumetricCaptureService {
  constructor() {
    this.reset();
  }

  reset() {
    this.captureId = null;
    this.startedAt = null;
    this.frames = [];
    this.active = false;
  }

  start(metadata = {}) {
    this.reset();
    this.captureId = uid();
    this.startedAt = Date.now();
    this.metadata = metadata;
    this.active = true;
  }

  stop() {
    this.active = false;
  }

  captureFrame({ camera, scene }) {
    if (!this.active || !camera || !scene) return;

    const cameraMatrix = camera.matrixWorld.elements.map((item) => Number(item.toFixed(6)));
    const projection = camera.projectionMatrix.elements.map((item) => Number(item.toFixed(6)));
    const cloud = [];

    scene.traverse((node) => {
      if (node?.isMesh && node.visible) {
        const meshPoints = sampleMeshPoints(node, 80);
        if (meshPoints.length > 0) {
          cloud.push({
            mesh: node.name || node.uuid,
            points: meshPoints,
          });
        }
      }
    });

    this.frames.push({
      timeMs: Date.now() - this.startedAt,
      cameraMatrix,
      projection,
      pointCloud: cloud,
      nerfHint: {
        rays: Math.min(2048, cloud.reduce((sum, item) => sum + item.points.length, 0) * 4),
        mode: 'multiview-snapshot',
      },
    });

    if (this.frames.length > 900) {
      this.frames.shift();
    }
  }

  exportJson() {
    const payload = {
      version: 1,
      type: 'volumetric-session-capture',
      captureId: this.captureId,
      startedAt: this.startedAt ? new Date(this.startedAt).toISOString() : null,
      endedAt: new Date().toISOString(),
      metadata: this.metadata || {},
      frames: this.frames,
    };

    return new Blob([JSON.stringify(payload)], { type: 'application/json' });
  }
}

let instance = null;

export function getVolumetricCaptureService() {
  if (!instance) {
    instance = new VolumetricCaptureService();
  }
  return instance;
}

export default VolumetricCaptureService;
