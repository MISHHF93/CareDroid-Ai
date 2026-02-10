import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '../../components/forms/Checkbox';
import { apiFetch } from '../../services/apiClient';
import './ConsentFlow.css';
import logger from '../../utils/logger';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * ConsentFlow Component
 * 
 * In-app consent collection for HIPAA, privacy policy, and terms
 * REQUIRED before user can access clinical tools
 * Tracks consent in audit log
 */
export const ConsentFlow = ({ onComplete }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [consents, setConsents] = useState({
    hipaa: false,
    privacy: false,
    terms: false,
    dataSharing: false,
    communications: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConsentChange = (key, checked) => {
    setConsents(prev => ({ ...prev, [key]: checked }));
    // Clear error when user checks the box
    if (checked && errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const validateConsents = () => {
    const newErrors = {};
    
    // Required consents
    if (!consents.hipaa) {
      newErrors.hipaa = t('legal.consent.hipaaRequired');
    }
    if (!consents.privacy) {
      newErrors.privacy = t('legal.consent.privacyRequired');
    }
    if (!consents.terms) {
      newErrors.terms = t('legal.consent.termsRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateConsents()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit consents to backend
      const response = await apiFetch('/api/consent/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          consents: {
            hipaa_authorization: consents.hipaa,
            privacy_policy: consents.privacy,
            terms_of_service: consents.terms,
            data_sharing: consents.dataSharing,
            marketing_communications: consents.communications,
          },
          consentDate: new Date().toISOString(),
          ipAddress: await fetch('https://api.ipify.org?format=json')
            .then(r => r.json())
            .then(d => d.ip)
            .catch(() => 'unknown'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record consent');
      }

      // Mark onboarding as complete
      localStorage.setItem('consentsAccepted', 'true');

      // Call completion callback or navigate
      if (onComplete) {
        onComplete();
      } else {
        navigate('/');
      }
    } catch (error) {
      logger.error('Consent submission error', { error });
      setErrors({ submit: t('legal.consent.submitError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="consent-flow">
      <div className="consent-container">
        <div className="consent-header">
          <h1>{t('legal.consent.title')}</h1>
          <p className="consent-intro">
            {t('legal.consent.intro')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="consent-form">
          {/* HIPAA Authorization */}
          <div className="consent-section consent-section-required">
            <div className="consent-section-header">
              <h2>1. {t('legal.consent.hipaaTitle')}</h2>
              <span className="consent-badge consent-badge-required">{t('legal.consent.required')}</span>
            </div>
            <div className="consent-content">
              <p>
                I authorize CareDroid to use and disclose my Protected Health Information (PHI) 
                for the purpose of providing clinical decision support services.
              </p>
              <div className="consent-details">
                <h4>What PHI May Be Used:</h4>
                <ul>
                  <li>Patient identifiers (as provided by you)</li>
                  <li>Medical history and clinical data</li>
                  <li>Laboratory results and diagnostic information</li>
                  <li>Treatment plans and recommendations</li>
                </ul>
                <h4>Who May Access PHI:</h4>
                <ul>
                  <li>You (the authorized user)</li>
                  <li>Authorized users in your organization</li>
                  <li>CareDroid's AI processing systems</li>
                  <li>HIPAA-compliant service providers under Business Associate Agreements</li>
                </ul>
                <h4>Your Rights:</h4>
                <ul>
                  <li>You may revoke this authorization at any time by contacting <a href="mailto:privacy@caredroid.ai">privacy@caredroid.ai</a></li>
                  <li>Revocation will not affect actions already taken</li>
                  <li>After revocation, you will not be able to use CareDroid's clinical tools</li>
                </ul>
              </div>
              <Checkbox
                id="consent-hipaa"
                label="I authorize the use of PHI as described above"
                checked={consents.hipaa}
                onChange={(checked) => handleConsentChange('hipaa', checked)}
                required
                error={errors.hipaa}
                size="lg"
              />
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="consent-section consent-section-required">
            <div className="consent-section-header">
              <h2>2. {t('legal.consent.privacyTitle')}</h2>
              <span className="consent-badge consent-badge-required">{t('legal.consent.required')}</span>
            </div>
            <div className="consent-content">
              <p>
                Please review our <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> to 
                understand how we collect, use, and protect your information.
              </p>
              <Checkbox
                id="consent-privacy"
                label="I have read and accept the Privacy Policy"
                checked={consents.privacy}
                onChange={(checked) => handleConsentChange('privacy', checked)}
                required
                error={errors.privacy}
                size="lg"
              />
            </div>
          </div>

          {/* Terms of Service */}
          <div className="consent-section consent-section-required">
            <div className="consent-section-header">
              <h2>3. {t('legal.consent.termsTitle')}</h2>
              <span className="consent-badge consent-badge-required">{t('legal.consent.required')}</span>
            </div>
            <div className="consent-content">
              <p>
                Please review our <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> including 
                our medical disclaimer and acceptable use policy.
              </p>
              <div className="consent-warning">
                <p>
                  <strong>⚠️ Important:</strong> CareDroid is a decision support tool only. 
                  It is NOT a substitute for professional medical judgment.
                </p>
              </div>
              <Checkbox
                id="consent-terms"
                label="I have read and accept the Terms of Service"
                checked={consents.terms}
                onChange={(checked) => handleConsentChange('terms', checked)}
                required
                error={errors.terms}
                size="lg"
              />
            </div>
          </div>

          {/* Data Sharing (Optional) */}
          <div className="consent-section consent-section-optional">
            <div className="consent-section-header">
              <h2>4. {t('legal.consent.dataResearchTitle')}</h2>
              <span className="consent-badge consent-badge-optional">{t('legal.consent.optional')}</span>
            </div>
            <div className="consent-content">
              <p>
                Help us improve CareDroid by allowing us to use anonymized, de-identified data 
                for research and AI model training. <strong>No PHI or personal information will be included.</strong>
              </p>
              <Checkbox
                id="consent-data-sharing"
                label="I consent to anonymized data use for research purposes"
                description="You can change this preference later in Settings"
                checked={consents.dataSharing}
                onChange={(checked) => handleConsentChange('dataSharing', checked)}
                size="lg"
              />
            </div>
          </div>

          {/* Communications (Optional) */}
          <div className="consent-section consent-section-optional">
            <div className="consent-section-header">
              <h2>5. {t('legal.consent.communicationsTitle')}</h2>
              <span className="consent-badge consent-badge-optional">{t('legal.consent.optional')}</span>
            </div>
            <div className="consent-content">
              <p>
                Receive updates about new features, clinical guidelines, and educational content. 
                You can unsubscribe at any time.
              </p>
              <Checkbox
                id="consent-communications"
                label="I want to receive product updates and educational content"
                description="No marketing or promotional emails"
                checked={consents.communications}
                onChange={(checked) => handleConsentChange('communications', checked)}
                size="lg"
              />
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="consent-error-global">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="consent-actions">
            <button
              type="button"
              className="btn-consent-secondary"
              onClick={() => navigate('/auth')}
              disabled={isSubmitting}
            >
              {t('legal.consent.cancel')}
            </button>
            <button
              type="submit"
              className="btn-consent-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('legal.consent.recordingConsent') : t('legal.consent.acceptAndContinue')}
            </button>
          </div>

          <p className="consent-footer-note">
            This consent will be recorded with a timestamp, your IP address, and user information 
            for our audit log as required by HIPAA.
          </p>
        </form>
      </div>
    </div>
  );
};
