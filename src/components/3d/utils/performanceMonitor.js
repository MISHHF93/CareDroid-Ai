/**
 * Performance Monitor Utility
 * Monitors frame rate and adjusts rendering quality accordingly
 */

/**
 * Create a frame-rate monitor that tracks FPS and adjusts quality
 * @param {Function} onQualityChange - Callback when quality level changes
 * @returns {{ start: Function, stop: Function, getFPS: Function }}
 */
export function createPerformanceMonitor(onQualityChange) {
  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 60;
  let rafId = null;
  let qualityLevel = 'high';

  function tick() {
    frameCount++;
    const now = performance.now();
    const elapsed = now - lastTime;

    if (elapsed >= 1000) {
      fps = Math.round((frameCount * 1000) / elapsed);
      frameCount = 0;
      lastTime = now;

      // Adjust quality based on FPS
      let newQuality = qualityLevel;
      if (fps < 25 && qualityLevel !== 'low') {
        newQuality = 'low';
      } else if (fps >= 25 && fps < 45 && qualityLevel === 'high') {
        newQuality = 'medium';
      } else if (fps >= 50 && qualityLevel !== 'high') {
        newQuality = 'high';
      }

      if (newQuality !== qualityLevel) {
        qualityLevel = newQuality;
        if (onQualityChange) onQualityChange(qualityLevel);
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  return {
    start() {
      if (!rafId) rafId = requestAnimationFrame(tick);
    },
    stop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
    getFPS() {
      return fps;
    },
    getQuality() {
      return qualityLevel;
    },
  };
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
