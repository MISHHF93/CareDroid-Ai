import { useEffect } from 'react';

function parseCommand(text = '') {
  const normalized = text.toLowerCase().trim();
  const actions = [];

  if (/show\s+heart/.test(normalized)) actions.push({ type: 'ORGAN_VISIBILITY', organ: 'heart', visible: true });
  if (/show\s+brain/.test(normalized)) actions.push({ type: 'ORGAN_VISIBILITY', organ: 'brain', visible: true });
  if (/show\s+lung|show\s+lungs/.test(normalized)) actions.push({ type: 'ORGAN_VISIBILITY', organ: 'lungs', visible: true });

  if (/hide\s+heart/.test(normalized)) actions.push({ type: 'ORGAN_VISIBILITY', organ: 'heart', visible: false });
  if (/hide\s+brain/.test(normalized)) actions.push({ type: 'ORGAN_VISIBILITY', organ: 'brain', visible: false });
  if (/hide\s+lung|hide\s+lungs/.test(normalized)) actions.push({ type: 'ORGAN_VISIBILITY', organ: 'lungs', visible: false });

  if (/zoom\s+in/.test(normalized)) actions.push({ type: 'CAMERA_ZOOM', direction: 'in', amount: 0.22 });
  if (/zoom\s+out/.test(normalized)) actions.push({ type: 'CAMERA_ZOOM', direction: 'out', amount: 0.22 });

  if (/rotate\s+left/.test(normalized)) actions.push({ type: 'CAMERA_ROTATE', direction: 'left', amount: 0.22 });
  if (/rotate\s+right/.test(normalized)) actions.push({ type: 'CAMERA_ROTATE', direction: 'right', amount: 0.22 });

  if (/increase\s+opacity/.test(normalized)) actions.push({ type: 'OPACITY', direction: 'up', amount: 0.12 });
  if (/decrease\s+opacity/.test(normalized)) actions.push({ type: 'OPACITY', direction: 'down', amount: 0.12 });

  return actions;
}

export default function VoiceCommandController({ enabled = false, onActions, onTranscript }) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return undefined;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1]?.[0]?.transcript || '';
      if (!transcript) return;
      onTranscript?.(transcript);
      const actions = parseCommand(transcript);
      if (actions.length > 0) {
        onActions?.(actions, transcript);
      }
    };

    recognition.onerror = () => {
      // noop
    };

    recognition.onend = () => {
      if (enabled) {
        try {
          recognition.start();
        } catch {
          // noop
        }
      }
    };

    try {
      recognition.start();
    } catch {
      // noop
    }

    return () => {
      try {
        recognition.stop();
      } catch {
        // noop
      }
    };
  }, [enabled, onActions, onTranscript]);

  return null;
}

export { parseCommand };
