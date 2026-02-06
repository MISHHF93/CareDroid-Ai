import React from 'react';
import { Card } from '../ui/molecules/Card';
import { Button } from '../ui/atoms/Button';
import { Badge } from '../ui/atoms/Badge';
import './PatientCard.css';

/**
 * PatientCard - Clinical patient information display component
 *
 * Features:
 * - Patient demographics and status
 * - Vital signs with abnormal value highlighting
 * - Active alerts and notifications
 * - Clinical actions (view details, update status, etc.)
 * - Responsive design for mobile workflows
 * - Accessibility compliant with ARIA labels
 *
 * @param {Object} props
 * @param {Object} props.patient - Patient data object
 * @param {string} props.patient.id - Unique patient identifier
 * @param {string} props.patient.name - Full patient name
 * @param {number} props.patient.age - Patient age in years
 * @param {string} props.patient.gender - Patient gender
 * @param {string} props.patient.room - Room number
 * @param {string} props.patient.bed - Bed number
 * @param {string} props.patient.admittingDiagnosis - Primary diagnosis
 * @param {Object} props.patient.vitals - Vital signs object
 * @param {Array} props.patient.alerts - Array of active alerts
 * @param {string} props.patient.status - Current status (stable, critical, etc.)
 * @param {boolean} props.showVitals - Whether to show vital signs section
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {boolean} props.compact - Compact display mode
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler for the card
 * @param {Function} props.onViewDetails - Callback for view details action
 * @param {Function} props.onUpdateVitals - Callback for update vitals action
 * @param {Function} props.onAddNote - Callback for add note action
 */
export const PatientCard = ({
  patient,
  onClick,
  showVitals = true,
  showActions = true,
  compact = false,
  className = '',
  onViewDetails,
  onUpdateVitals,
  onAddNote
}) => {
  const {
    id,
    name,
    age,
    gender,
    room,
    bed,
    admittingDiagnosis,
    vitals = {},
    alerts = [],
    status = 'stable'
  } = patient;

  // Get status badge variant based on patient status
  const getStatusVariant = (status) => {
    const statusMap = {
      'critical': 'error',
      'urgent': 'error',
      'moderate': 'warning',
      'stable': 'success',
      'discharged': 'info'
    };
    return statusMap[status.toLowerCase()] || 'default';
  };

  // Get alert severity variant
  const getAlertVariant = (severity) => {
    const severityMap = {
      'critical': 'error',
      'high': 'error',
      'medium': 'warning',
      'low': 'info'
    };
    return severityMap[severity.toLowerCase()] || 'default';
  };

  // Format vital signs with normal/abnormal indicators
  const formatVital = (value, unit, range) => {
    if (!value && value !== 0) return '--';
    const isAbnormal = range && (value < range.min || value > range.max);
    return (
      <span className={`vital-value ${isAbnormal ? 'vital-abnormal' : 'vital-normal'}`}>
        {value}{unit}
      </span>
    );
  };

  return (
    <Card
      variant="elevated"
      className={`patient-card ${compact ? 'patient-card-compact' : ''} ${className}`}
      interactive={!!onClick}
      onClick={onClick}
      role="article"
      aria-label={`Patient ${name}`}
      tabIndex={0}
    >
      {/* Patient Header */}
      <div className="patient-header">
        <div className="patient-info">
          <h3 className="patient-name">{name}</h3>
          <div className="patient-details">
            <span className="patient-age">{age} years old</span>
            <span className="patient-gender">{gender}</span>
            {room && bed && (
              <span className="patient-location">
                Room {room}, Bed {bed}
              </span>
            )}
          </div>
        </div>
        <div className="patient-status">
          <Badge
            variant={getStatusVariant(status)}
            size="lg"
          >
            {status}
          </Badge>
        </div>
      </div>

      {/* Primary Diagnosis */}
      {admittingDiagnosis && (
        <div className="patient-diagnosis">
          <span className="diagnosis-label">Primary Diagnosis</span>
          <p className="diagnosis-text">{admittingDiagnosis}</p>
        </div>
      )}

      {/* Vital Signs */}
      {showVitals && Object.keys(vitals).length > 0 && (
        <div className="patient-vitals">
          <h4 className="vitals-title">Latest Vitals</h4>
          <div className="vitals-grid">
            {vitals.heartRate && (
              <div
                className="vital-item"
                role="status"
                aria-label={`Heart rate: ${vitals.heartRate.value} bpm`}
              >
                <span className="vital-label">HR</span>
                {formatVital(vitals.heartRate.value, ' bpm', vitals.heartRate.range)}
              </div>
            )}
            {vitals.bloodPressure && (
              <div
                className="vital-item"
                role="status"
                aria-label={`Blood pressure: ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg`}
              >
                <span className="vital-label">BP</span>
                {formatVital(
                  `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`,
                  ' mmHg',
                  vitals.bloodPressure.range
                )}
              </div>
            )}
            {vitals.temperature && (
              <div
                className="vital-item"
                role="status"
                aria-label={`Temperature: ${vitals.temperature.value}°F`}
              >
                <span className="vital-label">Temp</span>
                {formatVital(vitals.temperature.value, '°F', vitals.temperature.range)}
              </div>
            )}
            {vitals.oxygenSat && (
              <div
                className="vital-item"
                role="status"
                aria-label={`Oxygen saturation: ${vitals.oxygenSat.value}%`}
              >
                <span className="vital-label">SpO2</span>
                {formatVital(vitals.oxygenSat.value, '%', vitals.oxygenSat.range)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="patient-alerts">
          {alerts.map((alert, index) => (
            <Badge
              key={index}
              variant={getAlertVariant(alert.severity)}
              className="alert-badge"
              aria-label={`Alert: ${alert.message}`}
            >
              {alert.message}
            </Badge>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="patient-actions">
          <Button
            variant="primary"
            size="sm"
            className="action-btn action-btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.(id);
            }}
            aria-label={`View details for ${name}`}
          >
            View Details
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="action-btn action-btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateVitals?.(id);
            }}
            aria-label={`Update vitals for ${name}`}
          >
            Update Vitals
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="action-btn action-btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAddNote?.(id);
            }}
            aria-label={`Add note for ${name}`}
          >
            Add Note
          </Button>
        </div>
      )}
    </Card>
  );
};

export default PatientCard;