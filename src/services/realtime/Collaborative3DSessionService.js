import { getWebSocketManager } from '../websocket/WebSocketManager';
import { getSessionReplayService } from './SessionReplayService';

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

class Collaborative3DSessionService {
  constructor() {
    this.wsManager = null;
    this.sessionId = null;
    this.localPeerId = uid('peer');
    this.localUser = null;
    this.localStream = null;
    this.peerConnections = new Map();
    this.remoteStreams = new Map();

    this.presence = new Map();
    this.annotations = [];
    this.whiteboardState = { strokes: [], anchor: [0, 0, 0], organ: 'general' };

    this.presenceListeners = [];
    this.annotationListeners = [];
    this.whiteboardListeners = [];
    this.streamListeners = [];
    this.permissionListeners = [];

    this.roleMap = new Map();
    this.replay = getSessionReplayService();
    this.unsubscribeFns = [];
  }

  async initialize({ token, sessionId, user, wsBaseUrl }) {
    this.wsManager = getWebSocketManager(wsBaseUrl);
    this.sessionId = sessionId || 'default-3d-session';
    this.localUser = user || {};

    await this.wsManager.connect(token);

    this.bindSubscriptions();
    this.replay.start({ sessionId: this.sessionId, userId: this.localUser?.id || 'anonymous' });

    this.roleMap.set(this.localPeerId, this.getRole(this.localUser));

    this.wsManager.send('COLLAB_JOIN_SESSION', {
      sessionId: this.sessionId,
      peerId: this.localPeerId,
      user: {
        id: this.localUser?.id || this.localPeerId,
        displayName: this.localUser?.fullName || this.localUser?.name || 'Clinician',
        color: this.localUser?.color || '#22d3ee',
        role: this.getRole(this.localUser),
      },
    });

    this.replay.record('JOINED_SESSION', { peerId: this.localPeerId });
  }

  bindSubscriptions() {
    this.unsubscribeFns.forEach((off) => off?.());
    this.unsubscribeFns = [];

    this.unsubscribeFns.push(this.wsManager.subscribe('COLLAB_PRESENCE', (payload) => {
      this.handlePresence(payload);
    }));

    this.unsubscribeFns.push(this.wsManager.subscribe('COLLAB_ANNOTATION', (payload) => {
      this.handleAnnotation(payload);
    }));

    this.unsubscribeFns.push(this.wsManager.subscribe('COLLAB_WHITEBOARD', (payload) => {
      this.handleWhiteboard(payload);
    }));

    this.unsubscribeFns.push(this.wsManager.subscribe('COLLAB_SIGNAL', (payload) => {
      this.handleSignal(payload);
    }));

    this.unsubscribeFns.push(this.wsManager.subscribe('COLLAB_RBAC', (payload) => {
      const { peerId, role } = payload || {};
      if (peerId && role) {
        this.roleMap.set(peerId, role);
        this.permissionListeners.forEach((listener) => listener(this.getPermissions(peerId)));
      }
    }));
  }

  getRole(user) {
    const role = user?.role || 'resident';
    if (role === 'physician' || role === 'admin') return 'attending';
    if (role === 'nurse') return 'fellow';
    return role === 'student' ? 'resident' : role;
  }

  getPermissions(peerId = this.localPeerId) {
    const role = this.roleMap.get(peerId) || 'resident';
    return {
      role,
      canManipulate: role === 'attending' || role === 'admin' || role === 'fellow',
      canAnnotate: role !== 'resident' ? true : false,
      canWhiteboard: role !== 'resident',
      canExportReplay: role === 'attending' || role === 'admin',
    };
  }

  onPermissions(listener) {
    this.permissionListeners.push(listener);
    listener(this.getPermissions());
    return () => {
      this.permissionListeners = this.permissionListeners.filter((item) => item !== listener);
    };
  }

  onPresence(listener) {
    this.presenceListeners.push(listener);
    listener(Array.from(this.presence.values()));
    return () => {
      this.presenceListeners = this.presenceListeners.filter((item) => item !== listener);
    };
  }

  onAnnotations(listener) {
    this.annotationListeners.push(listener);
    listener(this.annotations);
    return () => {
      this.annotationListeners = this.annotationListeners.filter((item) => item !== listener);
    };
  }

  onWhiteboard(listener) {
    this.whiteboardListeners.push(listener);
    listener(this.whiteboardState);
    return () => {
      this.whiteboardListeners = this.whiteboardListeners.filter((item) => item !== listener);
    };
  }

  onRemoteStreams(listener) {
    this.streamListeners.push(listener);
    listener(Array.from(this.remoteStreams.entries()).map(([peerId, stream]) => ({ peerId, stream })));
    return () => {
      this.streamListeners = this.streamListeners.filter((item) => item !== listener);
    };
  }

  broadcastPresence(presence) {
    const packet = {
      sessionId: this.sessionId,
      peerId: this.localPeerId,
      userId: this.localUser?.id || this.localPeerId,
      displayName: this.localUser?.fullName || this.localUser?.name || 'Clinician',
      color: this.localUser?.color || '#22d3ee',
      role: this.getRole(this.localUser),
      ...presence,
      timestamp: new Date().toISOString(),
    };

    this.presence.set(this.localPeerId, packet);
    this.presenceListeners.forEach((listener) => listener(Array.from(this.presence.values())));

    this.wsManager.send('COLLAB_PRESENCE', packet);
    this.replay.record('PRESENCE_UPDATED', packet);

    this.peerConnections.forEach((conn) => {
      if (conn.channel && conn.channel.readyState === 'open') {
        conn.channel.send(JSON.stringify({ type: 'PRESENCE', payload: packet }));
      }
    });
  }

  handlePresence(payload = {}) {
    const peerId = payload.peerId;
    if (!peerId || peerId === this.localPeerId) return;
    this.presence.set(peerId, payload);
    if (payload.role) this.roleMap.set(peerId, payload.role);
    this.presenceListeners.forEach((listener) => listener(Array.from(this.presence.values())));
  }

  addAnnotation(annotation) {
    const item = {
      id: uid('ann'),
      sessionId: this.sessionId,
      createdBy: this.localUser?.id || this.localPeerId,
      createdAt: new Date().toISOString(),
      ...annotation,
    };
    this.annotations = [...this.annotations, item].slice(-300);
    this.annotationListeners.forEach((listener) => listener(this.annotations));
    this.wsManager.send('COLLAB_ANNOTATION', item);
    this.replay.record('ANNOTATION_CREATED', item);
  }

  handleAnnotation(payload = {}) {
    if (!payload.id) return;
    if (this.annotations.some((item) => item.id === payload.id)) return;
    this.annotations = [...this.annotations, payload].slice(-300);
    this.annotationListeners.forEach((listener) => listener(this.annotations));
  }

  setWhiteboard(state) {
    this.whiteboardState = {
      ...this.whiteboardState,
      ...state,
      updatedBy: this.localUser?.id || this.localPeerId,
      updatedAt: new Date().toISOString(),
    };
    this.whiteboardListeners.forEach((listener) => listener(this.whiteboardState));
    this.wsManager.send('COLLAB_WHITEBOARD', {
      sessionId: this.sessionId,
      state: this.whiteboardState,
    });
    this.replay.record('WHITEBOARD_UPDATED', this.whiteboardState);
  }

  handleWhiteboard(payload = {}) {
    if (!payload?.state) return;
    this.whiteboardState = { ...this.whiteboardState, ...payload.state };
    this.whiteboardListeners.forEach((listener) => listener(this.whiteboardState));
  }

  async enableVoiceChat() {
    if (this.localStream) return this.localStream;
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    this.wsManager.send('COLLAB_SIGNAL', {
      sessionId: this.sessionId,
      fromPeerId: this.localPeerId,
      signalType: 'VOICE_READY',
    });
    this.replay.record('VOICE_CHAT_ENABLED', { peerId: this.localPeerId });
    return this.localStream;
  }

  async createPeerConnection(remotePeerId, initiator = false) {
    if (this.peerConnections.has(remotePeerId)) return this.peerConnections.get(remotePeerId);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    const connection = { pc, channel: null };
    this.peerConnections.set(remotePeerId, connection);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => pc.addTrack(track, this.localStream));
    }

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      this.wsManager.send('COLLAB_SIGNAL', {
        sessionId: this.sessionId,
        fromPeerId: this.localPeerId,
        toPeerId: remotePeerId,
        signalType: 'ICE_CANDIDATE',
        candidate: event.candidate,
      });
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;
      this.remoteStreams.set(remotePeerId, stream);
      this.streamListeners.forEach((listener) => listener(Array.from(this.remoteStreams.entries()).map(([peerId, s]) => ({ peerId, stream: s }))));
    };

    pc.ondatachannel = (event) => {
      connection.channel = event.channel;
      this.bindDataChannel(connection.channel);
    };

    if (initiator) {
      const channel = pc.createDataChannel('collab-sync');
      connection.channel = channel;
      this.bindDataChannel(channel);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.wsManager.send('COLLAB_SIGNAL', {
        sessionId: this.sessionId,
        fromPeerId: this.localPeerId,
        toPeerId: remotePeerId,
        signalType: 'SDP_OFFER',
        description: offer,
      });
    }

    return connection;
  }

  bindDataChannel(channel) {
    channel.onmessage = (event) => {
      try {
        const packet = JSON.parse(event.data);
        if (packet.type === 'PRESENCE') this.handlePresence(packet.payload);
        if (packet.type === 'ANNOTATION') this.handleAnnotation(packet.payload);
      } catch {
        // noop
      }
    };
  }

  async handleSignal(payload = {}) {
    const { fromPeerId, toPeerId, signalType, description, candidate } = payload;
    if (!fromPeerId || fromPeerId === this.localPeerId) return;
    if (toPeerId && toPeerId !== this.localPeerId) return;

    if (signalType === 'VOICE_READY') {
      const conn = await this.createPeerConnection(fromPeerId, true);
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          try {
            conn.pc.addTrack(track, this.localStream);
          } catch {
            // noop
          }
        });
      }
      return;
    }

    const conn = await this.createPeerConnection(fromPeerId, false);
    const pc = conn.pc;

    if (signalType === 'SDP_OFFER' && description) {
      await pc.setRemoteDescription(new RTCSessionDescription(description));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.wsManager.send('COLLAB_SIGNAL', {
        sessionId: this.sessionId,
        fromPeerId: this.localPeerId,
        toPeerId: fromPeerId,
        signalType: 'SDP_ANSWER',
        description: answer,
      });
      return;
    }

    if (signalType === 'SDP_ANSWER' && description) {
      await pc.setRemoteDescription(new RTCSessionDescription(description));
      return;
    }

    if (signalType === 'ICE_CANDIDATE' && candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  async exportReplay({ passphrase, metadata = {} }) {
    this.replay.stop();
    return this.replay.exportEncrypted({
      passphrase,
      metadata: {
        sessionId: this.sessionId,
        exportedBy: this.localUser?.id || this.localPeerId,
        ...metadata,
      },
    });
  }

  disconnect() {
    this.replay.record('LEFT_SESSION', { peerId: this.localPeerId });
    this.replay.stop();

    this.wsManager?.send('COLLAB_LEAVE_SESSION', {
      sessionId: this.sessionId,
      peerId: this.localPeerId,
    });

    this.unsubscribeFns.forEach((off) => off?.());
    this.unsubscribeFns = [];

    this.peerConnections.forEach(({ pc }) => pc.close());
    this.peerConnections.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    this.remoteStreams.clear();
    this.presence.clear();
    this.annotations = [];
    this.whiteboardState = { strokes: [], anchor: [0, 0, 0], organ: 'general' };
  }
}

let instance = null;

export function getCollaborative3DSessionService() {
  if (!instance) {
    instance = new Collaborative3DSessionService();
  }
  return instance;
}

export default Collaborative3DSessionService;
