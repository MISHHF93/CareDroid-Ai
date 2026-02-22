class PerformanceWorkerService {
  constructor() {
    this.worker = null;
    this.pending = new Map();
    this.nextId = 1;
    this.supported = typeof Worker !== 'undefined';
  }

  ensureWorker() {
    if (!this.supported || this.worker) return;

    this.worker = new Worker(new URL('../../workers/perfSimulation.worker.js', import.meta.url), { type: 'module' });
    this.worker.onmessage = (event) => {
      const { id, ok, result, error } = event.data || {};
      const handlers = this.pending.get(id);
      if (!handlers) return;
      this.pending.delete(id);
      if (ok) handlers.resolve(result);
      else handlers.reject(new Error(error || 'Worker task failed'));
    };
  }

  run(task, payload, transfer = []) {
    if (!this.supported) {
      return Promise.reject(new Error('Workers unsupported'));
    }
    this.ensureWorker();

    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, task, payload }, transfer);
    });
  }

  simulateBoids(payload) {
    return this.run('boids', payload, [payload.positions.buffer, payload.velocities.buffer]);
  }

  solvePathfinding(payload) {
    return this.run('pathfinding', payload);
  }

  processData(payload) {
    return this.run('data-processing', payload);
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pending.clear();
  }
}

let instance = null;

export function getPerformanceWorkerService() {
  if (!instance) {
    instance = new PerformanceWorkerService();
  }
  return instance;
}

export default PerformanceWorkerService;
