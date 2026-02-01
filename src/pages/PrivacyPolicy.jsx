import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import appConfig from '../config/appConfig';
import './LegalPages.css';

const PrivacyPolicy = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use configured URL if available, otherwise fall back to default path
    const url = appConfig.legal?.privacyPolicyUrl || '/legal/PRIVACY_POLICY.md';
    
    fetch(url)
      .then(res => res.text())
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load privacy policy:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="legal-page">
        <div className="legal-container">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <Link to="/" className="back-button">
            ← Back to App
          </Link>
          <h1>Privacy Policy</h1>
        </div>
        <div className="legal-content">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        <div className="legal-footer">
          <p>For questions about this Privacy Policy, contact:</p>
          <p>
            <strong>Email:</strong> privacy@caredroid-ai.com<br />
            <strong>Support:</strong> support@caredroid-ai.com
          </p>
          <div className="legal-links">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/hipaa">HIPAA Addendum</Link>
            <Link to="/gdpr">GDPR Notice</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
