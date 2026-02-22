import { getWebSocketManager } from '../websocket/WebSocketManager';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function nowIso() {
  return new Date().toISOString();
}

function seededNoise(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateSample(base, tick) {
  const drift = Math.sin(tick * 0.15) * 0.7;
  const hr = clamp(base.hr + drift * 6 + (seededNoise(tick * 1.21) - 0.5) * 2.8, 45, 180);
  const rr = clamp(base.rr + Math.sin(tick * 0.11) * 2 + (seededNoise(tick * 1.33) - 0.5) * 1.2, 8, 42);
  const spo2 = clamp(base.spo2 + Math.sin(tick * 0.08) * 0.8 - Math.max(0, drift) * 0.5, 75, 100);
  const temp = clamp(base.temp + Math.sin(tick * 0.05) * 0.25 + (seededNoise(tick * 1.47) - 0.5) * 0.08, 95, 105);
  const systolic = clamp(base.sys + Math.sin(tick * 0.09) * 4 + (seededNoise(tick * 1.07) - 0.5) * 3, 80, 220);
  const diastolic = clamp(base.dia + Math.sin(tick * 0.07 + 0.6) * 3 + (seededNoise(tick * 1.17) - 0.5) * 2, 45, 140);

  return {
    timestamp: nowIso(),
    source: 'simulated-hl7-observation',
    vitals: {
      heartRate: { value: Number(hr.toFixed(0)), unit: 'bpm' },
      bloodPressure: { systolic: Number(systolic.toFixed(0)), diastolic: Number(diastolic.toFixed(0)), unit: 'mmHg' },
      oxygenSat: { value: Number(spo2.toFixed(1)), unit: '%' },
      respiratoryRate: { value: Number(rr.toFixed(0)), unit: 'rpm' },
      temperature: { value: Number(temp.toFixed(1)), unit: '°F' },
    },
    medications: [
      { name: 'Norepinephrine', concentration: clamp(0.52 + Math.sin(tick * 0.04) * 0.35, 0, 1), halfLifeMinutes: 150 },
      { name: 'Cefepime', concentration: clamp(0.34 + Math.sin(tick * 0.035 + 1.2) * 0.25, 0, 1), halfLifeMinutes: 120 },
    ],
    forecast: {
      heartRate: Number(clamp(hr + 6 + Math.sin(tick * 0.03) * 4, 45, 190).toFixed(0)),
      oxygenSat: Number(clamp(spo2 - 1.1 + Math.sin(tick * 0.04) * 0.7, 70, 100).toFixed(1)),
      respiratoryRate: Number(clamp(rr + 1.6, 8, 45).toFixed(0)),
      confidence: clamp(0.72 + Math.sin(tick * 0.02) * 0.12, 0.45, 0.95),
    },
  };
}

class FhirVitalsStreamService {
  constructor() {
    this.wsManager = null;
    this.listeners = [];
    this.unsubscribeFns = [];
    this.simulationTimer = null;
    this.tick = 0;
    this.currentPatientId = null;
  }

  async initialize({ token, patientId, wsBaseUrl }) {
    this.currentPatientId = patientId || 'default-patient';
    this.wsManager = getWebSocketManager(wsBaseUrl);

    try {
      if (token) {
        await this.wsManager.connect(token);
        this.bindWebSocketSubscriptions();
        this.subscribeToPatient(patientId);
      } else {
        this.startSimulation();
      }
    } catch {
      this.startSimulation();
    }
  }

  bindWebSocketSubscriptions() {
    const types = [
      'FHIR_OBSERVATION',
      'HL7_OBSERVATION',
      'VITALS_UPDATE',
      'PATIENT_OBSERVATION',
    ];

    this.unsubscribeFns.forEach((off) => off?.());
    this.unsubscribeFns = types.map((type) => this.wsManager.subscribe(type, (payload) => {
      this.emit(this.normalizePayload(payload));
    }));
  }

  subscribeToPatient(patientId) {
    if (!this.wsManager) return;

    const id = patientId || this.currentPatientId || 'default-patient';
    this.wsManager.send('SUBSCRIBE_FHIR_OBSERVATIONS', {
      patientId: id,
      resourceType: 'Observation',
      profile: 'http://hl7.org/fhir/StructureDefinition/vitalsigns',
      channel: 'hl7-vitals-live',
      latencyTargetMs: 300,
    });
  }

  normalizePayload(payload = {}) {
    const vitals = payload.vitals || payload.observation || payload.data || {};

    const hr = Number(vitals?.heartRate?.value ?? vitals?.HR ?? vitals?.heartRate ?? 72);
    const spo2 = Number(vitals?.oxygenSat?.value ?? vitals?.SpO2 ?? vitals?.oxygenSat ?? 97);
    const rr = Number(vitals?.respiratoryRate?.value ?? vitals?.RR ?? vitals?.respiratoryRate ?? 16);

    const bloodPressure = vitals?.bloodPressure || {};
    const systolic = Number(bloodPressure?.systolic ?? vitals?.BP_sys ?? 122);
    const diastolic = Number(bloodPressure?.diastolic ?? vitals?.BP_dia ?? 78);

    const temp = Number(vitals?.temperature?.value ?? vitals?.temp ?? vitals?.temperature ?? 98.6);

    return {
      timestamp: payload.timestamp || nowIso(),
      source: payload.source || 'fhir-hl7-stream',
      vitals: {
        heartRate: { value: clamp(hr, 20, 240), unit: 'bpm' },
        bloodPressure: { systolic: clamp(systolic, 40, 260), diastolic: clamp(diastolic, 20, 180), unit: 'mmHg' },
        oxygenSat: { value: clamp(spo2, 40, 100), unit: '%' },
        respiratoryRate: { value: clamp(rr, 4, 60), unit: 'rpm' },
        temperature: { value: clamp(temp, 90, 110), unit: '°F' },
      },
      medications: payload.medications || [],
      forecast: payload.forecast || null,
    };
  }

  onVitalsUpdate(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) this.listeners.splice(index, 1);
    };
  }

  emit(data) {
    this.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch {
        // noop
      }
    });
  }

  startSimulation(base = { hr: 86, rr: 17, spo2: 97.2, temp: 98.7, sys: 124, dia: 79 }) {
    this.stopSimulation();
    this.tick = 0;

    this.simulationTimer = setInterval(() => {
      this.tick += 1;
      this.emit(generateSample(base, this.tick));
    }, 400);
  }

  stopSimulation() {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
  }

  disconnect() {
    this.stopSimulation();
    this.unsubscribeFns.forEach((off) => off?.());
    this.unsubscribeFns = [];
    this.listeners = [];
  }
}

let instance = null;

export function getFhirVitalsStreamService() {
  if (!instance) {
    instance = new FhirVitalsStreamService();
  }
  return instance;
}

export default FhirVitalsStreamService;
