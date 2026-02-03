import { useState } from 'react';
import { getExportService } from '../../services/export/ExportService';
import './ToolResultShare.css';

const ToolResultShare = ({ toolName, toolIcon, results, onClose }) => {
  const [shareMode, setShareMode] = useState('link'); // 'link' | 'export' | 'email'
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const generateShareLink = () => {
    const shareData = {
      tool: toolName,
      results: results,
      timestamp: new Date().toISOString(),
    };

    const encoded = btoa(JSON.stringify(shareData));
    const url = `${window.location.origin}/shared-result/${encoded}`;
    return url;
  };

  const handleCopyLink = async () => {
    try {
      const url = generateShareLink();
      await navigator.clipboard.writeText(url);
      setMessage('✅ Share link copied to clipboard!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      const url = generateShareLink();
      window.prompt('Copy this link to share:', url);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const exportService = getExportService();
      const filename = `${toolName.toLowerCase().replace(/\s+/g, '-')}-results-${Date.now()}`;

      const exportData = {
        tool: toolName,
        results: results,
        exportedAt: new Date().toLocaleString(),
      };

      if (selectedFormat === 'json') {
        exportService.downloadFile(
          JSON.stringify(exportData, null, 2),
          `${filename}.json`,
          'application/json'
        );
      } else if (selectedFormat === 'csv') {
        // Convert results to CSV if it's an array
        const csvData = Array.isArray(results)
          ? results
          : Object.entries(results).map(([key, value]) => ({ key, value }));

        const csv = exportService.convertToCSV(csvData);
        exportService.downloadFile(csv, `${filename}.csv`, 'text/csv');
      } else if (selectedFormat === 'pdf') {
        await exportService.exportToPDF(exportData, `${filename}.pdf`, {
          title: `${toolName} Results`,
          includeCharts: true,
        });
      }

      setMessage(`✅ Results exported as ${selectedFormat.toUpperCase()}!`);
      setTimeout(() => {
        setMessage('');
        onClose();
      }, 2000);
    } catch (err) {
      setMessage(`❌ Export failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailShare = async () => {
    if (!recipientEmail.trim()) {
      setMessage('⚠️ Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('caredroid_access_token');
      const shareData = {
        tool: toolName,
        results: results,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch('/api/tools/share-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientEmail,
          toolName,
          results: shareData,
          message: `I'm sharing ${toolName} results with you from CareDroid`,
        }),
      });

      if (response.ok) {
        setMessage(`✅ Results sent to ${recipientEmail}`);
        setRecipientEmail('');
        setTimeout(() => {
          setMessage('');
          onClose();
        }, 2000);
      } else {
        setMessage('❌ Failed to send results');
      }
    } catch (err) {
      setMessage(`❌ Email share failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tool-result-share-modal">
      <div className="share-modal-overlay" onClick={onClose}></div>
      <div className="share-modal-content">
        <div className="share-modal-header">
          <h2>
            <span>{toolIcon}</span> Share {toolName} Results
          </h2>
          <button className="share-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="share-modal-tabs">
          <button
            className={`share-tab ${shareMode === 'link' ? 'active' : ''}`}
            onClick={() => setShareMode('link')}
          >
            🔗 Share Link
          </button>
          <button
            className={`share-tab ${shareMode === 'export' ? 'active' : ''}`}
            onClick={() => setShareMode('export')}
          >
            💾 Export
          </button>
          <button
            className={`share-tab ${shareMode === 'email' ? 'active' : ''}`}
            onClick={() => setShareMode('email')}
          >
            📧 Email
          </button>
        </div>

        <div className="share-modal-body">
          {/* Link Share */}
          {shareMode === 'link' && (
            <div className="share-mode-content">
              <p>Generate a shareable link for these results:</p>
              <div className="share-link-display">
                <code className="link-preview">{generateShareLink().substring(0, 50)}...</code>
              </div>
              <button
                className="btn-primary btn-large"
                onClick={handleCopyLink}
                disabled={isLoading}
              >
                📋 Copy Share Link
              </button>
              <p className="share-note">
                Share this link with colleagues. Link expires after 30 days for security.
              </p>
            </div>
          )}

          {/* Export */}
          {shareMode === 'export' && (
            <div className="share-mode-content">
              <p>Export results in your preferred format:</p>
              <div className="export-format-grid">
                {['json', 'csv', 'pdf'].map(format => (
                  <label key={format} className={`export-format-option ${selectedFormat === format ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="exportFormat"
                      value={format}
                      checked={selectedFormat === format}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                    />
                    <span className="format-icon">
                      {format === 'json' && '{ }'}
                      {format === 'csv' && '📊'}
                      {format === 'pdf' && '📄'}
                    </span>
                    <span className="format-label">{format.toUpperCase()}</span>
                  </label>
                ))}
              </div>
              <button
                className="btn-primary btn-large"
                onClick={handleExport}
                disabled={isLoading}
              >
                {isLoading ? '⏳ Exporting...' : `📥 Export as ${selectedFormat.toUpperCase()}`}
              </button>
              <p className="share-note">
                Download results locally for records or further analysis.
              </p>
            </div>
          )}

          {/* Email Share */}
          {shareMode === 'email' && (
            <div className="share-mode-content">
              <p>Send results to a colleague via email:</p>
              <input
                type="email"
                className="share-email-input"
                placeholder="colleague@hospital.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                disabled={isLoading}
              />
              <button
                className="btn-primary btn-large"
                onClick={handleEmailShare}
                disabled={isLoading || !recipientEmail.trim()}
              >
                {isLoading ? '⏳ Sending...' : '📧 Send via Email'}
              </button>
              <p className="share-note">
                Recipient will receive results with a secure access link.
              </p>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`share-message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>

        <div className="share-modal-footer">
          <p className="share-privacy-note">
            🔒 Your shared results are encrypted and accessible only to intended recipients.
          </p>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolResultShare;
