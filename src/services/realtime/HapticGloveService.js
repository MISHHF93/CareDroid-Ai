function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

class HapticGloveService {
  constructor() {
    this.enabled = false;
  }

  initialize() {
    this.enabled = true;
  }

  getActuators() {
    const gamepads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    const actuators = [];

    gamepads.forEach((pad) => {
      if (pad?.hapticActuators?.length) {
        pad.hapticActuators.forEach((actuator) => actuators.push(actuator));
      }
      if (pad?.vibrationActuator) {
        actuators.push(pad.vibrationActuator);
      }
    });

    return actuators;
  }

  pulse({ intensity = 0.4, duration = 35 } = {}) {
    if (!this.enabled) return;
    const safeIntensity = clamp(intensity, 0, 1);
    const safeDuration = clamp(duration, 10, 300);

    this.getActuators().forEach((actuator) => {
      if (!actuator) return;
      if (typeof actuator.pulse === 'function') {
        actuator.pulse(safeIntensity, safeDuration).catch(() => {
          // noop
        });
      } else if (typeof actuator.playEffect === 'function') {
        actuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: safeDuration,
          weakMagnitude: safeIntensity * 0.7,
          strongMagnitude: safeIntensity,
        }).catch(() => {
          // noop
        });
      }
    });
  }

  tissueResistancePulse(stiffness = 0.5) {
    this.pulse({ intensity: clamp(stiffness, 0.1, 1), duration: 48 });
  }
}

let instance = null;

export function getHapticGloveService() {
  if (!instance) {
    instance = new HapticGloveService();
  }
  return instance;
}

export default HapticGloveService;
