/**
 * Performance Monitor Utility
 * Monitors frame rate and adjusts rendering quality accordingly
 */

export class PerformanceMonitor {
  constructor() {
    this.fps = 60;
    this.lastTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.frameCount = 0;
    this.rafId = null;
  }

  tick = () => {
    this.frameCount += 1;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const elapsed = now - this.lastTime;

    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = now;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  start() {
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getFPS() {
    return this.fps;
  }
}

export function createPerformanceMonitor() {
  return new PerformanceMonitor();
}

/**
 * Throttle a render function to a target FPS
 * @param {Function} fn - Function to throttle
 * @param {number} targetFPS - Target frames per second
 * @returns {Function} Throttled function
 */
export function throttleToFPS(fn, targetFPS = 60) {
  const interval = 1000 / targetFPS;
  // Initialize to -Infinity so the first call always fires
  let lastTime = -Infinity;

  return function throttled(time) {
    if (time - lastTime >= interval) {
      lastTime = time;
      fn(time);
    }
  };
}
