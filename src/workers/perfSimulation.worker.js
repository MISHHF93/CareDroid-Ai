function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateBoids(payload) {
  const { positions, velocities, count, infectionSeverity = 0.6, delta = 0.016 } = payload;
  const nextPos = new Float32Array(positions);
  const nextVel = new Float32Array(velocities);
  const neighborsToSample = 6;
  const dtScale = clamp(delta / 0.016, 0.25, 2.5);

  for (let i = 0; i < count; i += 1) {
    const base = i * 3;
    const px = nextPos[base];
    const py = nextPos[base + 1];
    const pz = nextPos[base + 2];

    let alignX = 0;
    let alignY = 0;
    let alignZ = 0;
    let cohX = 0;
    let cohY = 0;
    let cohZ = 0;
    let sepX = 0;
    let sepY = 0;
    let sepZ = 0;

    for (let s = 0; s < neighborsToSample; s += 1) {
      const j = (i + 1 + s * 37) % count;
      const b = j * 3;
      const qx = nextPos[b];
      const qy = nextPos[b + 1];
      const qz = nextPos[b + 2];

      alignX += nextVel[b];
      alignY += nextVel[b + 1];
      alignZ += nextVel[b + 2];

      cohX += qx;
      cohY += qy;
      cohZ += qz;

      const dx = px - qx;
      const dy = py - qy;
      const dz = pz - qz;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < 0.05) {
        sepX += dx * 0.03;
        sepY += dy * 0.03;
        sepZ += dz * 0.03;
      }
    }

    alignX /= neighborsToSample;
    alignY /= neighborsToSample;
    alignZ /= neighborsToSample;

    cohX = cohX / neighborsToSample - px;
    cohY = cohY / neighborsToSample - py;
    cohZ = cohZ / neighborsToSample - pz;

    nextVel[base] += (alignX * 0.008 + cohX * 0.004 + sepX * 0.01) * dtScale;
    nextVel[base + 1] += (alignY * 0.008 + cohY * 0.004 + sepY * 0.01) * dtScale;
    nextVel[base + 2] += (alignZ * 0.008 + cohZ * 0.004 + sepZ * 0.01) * dtScale;

    const speed = Math.sqrt(
      nextVel[base] * nextVel[base] +
      nextVel[base + 1] * nextVel[base + 1] +
      nextVel[base + 2] * nextVel[base + 2]
    );
    const maxSpeed = 0.018 + infectionSeverity * 0.02;

    if (speed > maxSpeed) {
      const k = maxSpeed / Math.max(speed, 1e-6);
      nextVel[base] *= k;
      nextVel[base + 1] *= k;
      nextVel[base + 2] *= k;
    }

    nextPos[base] += nextVel[base] * dtScale;
    nextPos[base + 1] += nextVel[base + 1] * dtScale;
    nextPos[base + 2] += nextVel[base + 2] * dtScale;

    const radial = Math.sqrt(
      nextPos[base] * nextPos[base] +
      nextPos[base + 1] * nextPos[base + 1] +
      nextPos[base + 2] * nextPos[base + 2]
    );
    const boundary = 1.8 + infectionSeverity * 0.8;
    if (radial > boundary) {
      nextPos[base] *= 0.97;
      nextPos[base + 1] *= 0.97;
      nextPos[base + 2] *= 0.97;
      nextVel[base] *= -0.4;
      nextVel[base + 1] *= -0.4;
      nextVel[base + 2] *= -0.4;
    }
  }

  return { positions: nextPos, velocities: nextVel };
}

function astar(payload) {
  const { width = 24, height = 24, start = [0, 0], goal = [23, 23], blocked = [] } = payload;
  const blockedSet = new Set(blocked.map((b) => `${b[0]}:${b[1]}`));
  const key = (x, y) => `${x}:${y}`;
  const h = (x, y) => Math.abs(goal[0] - x) + Math.abs(goal[1] - y);
  const open = [{ x: start[0], y: start[1], g: 0, f: h(start[0], start[1]), parent: null }];
  const visited = new Map();

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift();
    if (current.x === goal[0] && current.y === goal[1]) {
      const path = [];
      let node = current;
      while (node) {
        path.push([node.x, node.y]);
        node = node.parent;
      }
      return { path: path.reverse(), cost: current.g };
    }

    visited.set(key(current.x, current.y), current.g);
    const neighbors = [[1,0],[-1,0],[0,1],[0,-1]];
    neighbors.forEach(([dx, dy]) => {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
      if (blockedSet.has(key(nx, ny))) return;

      const ng = current.g + 1;
      const prev = visited.get(key(nx, ny));
      if (typeof prev === 'number' && prev <= ng) return;

      open.push({ x: nx, y: ny, g: ng, f: ng + h(nx, ny), parent: current });
    });
  }

  return { path: [], cost: Number.POSITIVE_INFINITY };
}

self.onmessage = (event) => {
  const { id, task, payload } = event.data || {};
  try {
    if (task === 'boids') {
      const result = updateBoids(payload || {});
      self.postMessage({ id, ok: true, result }, [result.positions.buffer, result.velocities.buffer]);
      return;
    }

    if (task === 'pathfinding') {
      const result = astar(payload || {});
      self.postMessage({ id, ok: true, result });
      return;
    }

    if (task === 'data-processing') {
      const items = Array.isArray(payload?.items) ? payload.items : [];
      const total = items.reduce((sum, n) => sum + Number(n || 0), 0);
      const avg = items.length ? total / items.length : 0;
      self.postMessage({ id, ok: true, result: { total, avg, count: items.length } });
      return;
    }

    self.postMessage({ id, ok: false, error: 'Unknown task' });
  } catch (error) {
    self.postMessage({ id, ok: false, error: error?.message || 'Worker error' });
  }
};
