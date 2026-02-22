import offlineService from '../offlineService';

function toUint8(input) {
  return new TextEncoder().encode(input);
}

async function deriveAesKey(passphrase) {
  const hash = await crypto.subtle.digest('SHA-256', toUint8(passphrase));
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt']);
}

class SessionReplayService {
  constructor() {
    this.reset();
  }

  reset() {
    this.events = [];
    this.startedAt = null;
    this.endedAt = null;
    this.active = false;
    this.sessionId = null;
    this.userId = null;
  }

  start({ sessionId, userId }) {
    this.reset();
    this.active = true;
    this.sessionId = sessionId;
    this.userId = userId;
    this.startedAt = Date.now();
    this.record('SESSION_STARTED', { sessionId, userId });
  }

  stop() {
    if (!this.active) return;
    this.record('SESSION_STOPPED', { sessionId: this.sessionId });
    this.endedAt = Date.now();
    this.active = false;
  }

  record(type, payload = {}) {
    if (!this.startedAt) return;
    const event = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      payload,
      at: Date.now(),
      offsetMs: Date.now() - this.startedAt,
    };
    this.events.push(event);
    this.audit(event).catch(() => {
      // noop
    });
  }

  async audit(event) {
    try {
      const db = await offlineService.getDb();
      await db.auditLogs.add({
        userId: this.userId || 'unknown',
        action: `COLLAB_3D_${event.type}`,
        timestamp: new Date(event.at).toISOString(),
        details: event.payload,
        sessionId: this.sessionId,
        synced: false,
      });
    } catch {
      // noop
    }
  }

  getTimeline() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startedAt: this.startedAt ? new Date(this.startedAt).toISOString() : null,
      endedAt: this.endedAt ? new Date(this.endedAt).toISOString() : null,
      durationMs: this.endedAt && this.startedAt ? this.endedAt - this.startedAt : 0,
      events: this.events,
    };
  }

  async exportEncrypted({ passphrase, metadata = {} }) {
    const replay = this.getTimeline();
    const body = JSON.stringify({
      replay,
      metadata,
      hipaa: {
        encryption: 'AES-GCM',
        phiProtected: true,
        exportedAt: new Date().toISOString(),
      },
    });

    const key = await deriveAesKey(passphrase || 'caredroid-default-replay-key');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, toUint8(body));

    const payload = {
      version: 1,
      alg: 'AES-GCM',
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(encrypted)),
    };

    return new Blob([JSON.stringify(payload)], { type: 'application/json' });
  }
}

let instance = null;

export function getSessionReplayService() {
  if (!instance) {
    instance = new SessionReplayService();
  }
  return instance;
}

export default SessionReplayService;
