class SpatialAnchorService {
  constructor() {
    this.storageKey = 'caredroid_xr_spatial_anchors_v1';
    this.anchors = [];
    this.listeners = [];
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      this.anchors = raw ? JSON.parse(raw) : [];
    } catch {
      this.anchors = [];
    }
  }

  persist() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.anchors));
    } catch {
      // noop
    }
  }

  list(sessionId) {
    if (!sessionId) return this.anchors;
    return this.anchors.filter((anchor) => anchor.sessionId === sessionId);
  }

  upsert(anchor) {
    if (!anchor?.id) return;
    const index = this.anchors.findIndex((item) => item.id === anchor.id);
    if (index >= 0) {
      this.anchors[index] = { ...this.anchors[index], ...anchor, updatedAt: new Date().toISOString() };
    } else {
      this.anchors.push({ ...anchor, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.persist();
    this.emit();
  }

  remove(id) {
    this.anchors = this.anchors.filter((item) => item.id !== id);
    this.persist();
    this.emit();
  }

  clearSession(sessionId) {
    this.anchors = this.anchors.filter((item) => item.sessionId !== sessionId);
    this.persist();
    this.emit();
  }

  onChange(listener) {
    this.listeners.push(listener);
    listener(this.anchors);
    return () => {
      this.listeners = this.listeners.filter((item) => item !== listener);
    };
  }

  emit() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.anchors);
      } catch {
        // noop
      }
    });
  }
}

let instance = null;

export function getSpatialAnchorService() {
  if (!instance) {
    instance = new SpatialAnchorService();
  }
  return instance;
}

export default SpatialAnchorService;
