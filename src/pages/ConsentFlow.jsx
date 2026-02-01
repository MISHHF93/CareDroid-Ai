import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiAxios } from '../services/apiClient';
import './ConsentFlow.css';

const ConsentFlow = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [consents, setConsents] = useState({
    privacy: false,
    terms: false,
    hipaa: false,
    dataProcessing: false,
    notifications: false,
    analytics: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user has already consented
    checkExistingConsent();
  }, []);

  const checkExistingConsent = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await apiAxios.get('/api/legal/consent/status', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.hasConsented) {
        // User already consented, redirect to app
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to check consent status:', err);
    }
  };

  const handleCheckbox = (name, value) => {
    setConsents(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNext = () => {
    // Validate required consents for current step
    if (step === 1) {
      if (!consents.privacy || !consents.terms || !consents.hipaa) {
        setError('You must accept all required agreements to continue.');
        return;
      }
    }
    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await apiAxios.post(
        '/api/legal/consent',
        {
          privacy: consents.privacy,
          terms: consents.terms,
          hipaa: consents.hipaa,
          dataProcessing: consents.dataProcessing,
          notifications: consents.notifications,
          analytics: consents.analytics,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Consent recorded successfully
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to submit consent:', err);
      setError('Failed to save your preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="consent-flow">
      <div className="consent-container">
        <div className="consent-header">
          <h1>Welcome to CareDroid-AI</h1>
          <p>Before you begin, please review and accept our policies</p>
          <div className="consent-progress">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>
        </div>

        {/* Step 1: Required Legal Agreements */}
        {step === 1 && (
          <div className="consent-step">
            <h2>Required Legal Agreements</h2>
            <p className="step-description">
              These agreements are required to use CareDroid-AI. Please review each document carefully.
            </p>

            <div className="consent-section">
              <div className="consent-item">
                <label className="consent-checkbox">
                  <input
                    type="checkbox"
                    checked={consents.privacy}
                    onChange={e => handleCheckbox('privacy', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="consent-label">
                    I have read and accept the{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer">
                      Privacy Policy
                    </a>{' '}
                    <span className="required">*</span>
                  </span>
                </label>
                <p className="consent-description">
                  Covers how we collect, use, and protect your personal and health information (PHI).
                </p>
              </div>

              <div className="consent-item">
                <label className="consent-checkbox">
                  <input
                    type="checkbox"
                    checked={consents.terms}
                    onChange={e => handleCheckbox('terms', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="consent-label">
                    I have read and accept the{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer">
                      Terms of Service
                    </a>{' '}
                    <span className="required">*</span>
                  </span>
                </label>
                <p className="consent-description">
                  Outlines your rights and responsibilities when using CareDroid-AI services.
                </p>
              </div>

              <div className="consent-item">
                <label className="consent-checkbox">
                  <input
                    type="checkbox"
                    checked={consents.hipaa}
                    onChange={e => handleCheckbox('hipaa', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="consent-label">
                    I acknowledge the{' '}
                    <a href="/hipaa" target="_blank" rel="noopener noreferrer">
                      HIPAA Notice
                    </a>{' '}
                    <span className="required">*</span>
                  </span>
                </label>
                <p className="consent-description">
                  Explains your rights under HIPAA and how we protect your Protected Health Information (PHI).
                </p>
              </div>
            </div>

            <div className="medical-disclaimer">
              <h3>⚠️ Important Medical Disclaimer</h3>
              <p>
                <strong>CareDroid-AI is a clinical decision support tool and NOT a replacement for professional
                medical advice.</strong> Always consult a qualified healthcare provider for medical decisions. In
                emergencies, call 911 immediately.
              </p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="consent-actions">
              <button onClick={() => navigate('/login')} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleNext} className="btn-primary">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Data Processing Consent */}
        {step === 2 && (
          <div className="consent-step">
            <h2>Data Processing & Sharing</h2>
            <p className="step-description">
              To provide AI-powered medical assistance, we process your health data with HIPAA-compliant service
              providers.
            </p>

            <div className="consent-section">
              <div className="consent-item">
                <label className="consent-checkbox">
                  <input
                    type="checkbox"
                    checked={consents.dataProcessing}
                    onChange={e => handleCheckbox('dataProcessing', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="consent-label">
                    I consent to AI processing of my health data{' '}
                    <span className="required">*</span>
                  </span>
                </label>
                <p className="consent-description">
                  Your medical queries and health information will be processed by:
                </p>
                <ul className="data-processors">
                  <li><strong>OpenAI:</strong> AI language models for medical assistance (BAA in place)</li>
                  <li><strong>Pinecone:</strong> Vector database for medical knowledge search (BAA in place)</li>
                  <li><strong>AWS/GCP:</strong> Secure cloud infrastructure (BAA in place)</li>
                </ul>
                <p className="consent-description">
                  All service providers have signed Business Associate Agreements (BAAs) and comply with HIPAA.
                </p>
              </div>

              <div className="info-box">
                <h4>🔒 Your Data is Protected</h4>
                <ul>
                  <li>AES-256-GCM encryption at rest</li>
                  <li>TLS 1.3 encryption in transit</li>
                  <li>We never sell your data</li>
                  <li>Audit logs track all PHI access</li>
                </ul>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="consent-actions">
              <button onClick={handleBack} className="btn-secondary">
                Back
              </button>
              <button
                onClick={handleNext}
                className="btn-primary"
                disabled={!consents.dataProcessing}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Optional Preferences */}
        {step === 3 && (
          <div className="consent-step">
            <h2>Optional Preferences</h2>
            <p className="step-description">
              These preferences are optional and can be changed anytime in Settings.
            </p>

            <div className="consent-section">
              <div className="consent-item">
                <label className="consent-checkbox">
                  <input
                    type="checkbox"
                    checked={consents.notifications}
                    onChange={e => handleCheckbox('notifications', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="consent-label">
                    Enable push notifications
                  </span>
                </label>
                <p className="consent-description">
                  Receive emergency alerts, medication reminders, and important health updates.
                </p>
              </div>

              <div className="consent-item">
                <label className="consent-checkbox">
                  <input
                    type="checkbox"
                    checked={consents.analytics}
                    onChange={e => handleCheckbox('analytics', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="consent-label">
                    Help improve CareDroid-AI
                  </span>
                </label>
                <p className="consent-description">
                  Share anonymized usage data to help us improve the app. No PHI is included in analytics.
                </p>
              </div>
            </div>

            <div className="info-box">
              <h4>✓ You're Almost Done!</h4>
              <p>
                By clicking "Accept and Continue", you'll be able to start using CareDroid-AI's AI-powered
                medical assistance.
              </p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="consent-actions">
              <button onClick={handleBack} className="btn-secondary" disabled={loading}>
                Back
              </button>
              <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Accept and Continue'}
              </button>
            </div>
          </div>
        )}

        <div className="consent-footer">
          <p>
            <small>
              By continuing, you confirm that you are 18+ years old and have the authority to accept these
              agreements. You can review your consent choices anytime in Settings → Privacy.
            </small>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsentFlow;
