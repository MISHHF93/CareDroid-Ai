import React, { useState } from 'react';
import { PatientCard } from '../components/clinical/PatientCard';
import { Card } from '../components/ui/molecules/Card';
import { Button } from '../components/ui/atoms/Button';
import { Badge } from '../components/ui/atoms/Badge';
import AppShell from '../layout/AppShell';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * ClinicalDashboard - Demonstration of the enhanced clinical design system
 * Showcases PatientCard component and clinical UI patterns
 */
function ClinicalDashboard() {
  const { t } = useLanguage();
  // Sample patient data for demonstration
  const [patients] = useState([
    {
      id: 'P001',
      name: 'Sarah Johnson',
      age: 67,
      gender: 'Female',
      room: '312',
      bed: 'A',
      status: 'critical',
      admittingDiagnosis: 'Acute Myocardial Infarction with cardiogenic shock',
      vitals: {
        heartRate: { value: 110, unit: 'bpm', range: { min: 60, max: 100 } },
        bloodPressure: { systolic: 85, diastolic: 55, unit: 'mmHg', range: { min: 90, max: 140 } },
        temperature: { value: 101.2, unit: '°F', range: { min: 97, max: 99 } },
        oxygenSat: { value: 92, unit: '%', range: { min: 95, max: 100 } }
      },
      alerts: [
        { message: 'Critical: BP dropping', severity: 'critical' },
        { message: 'Fever spike', severity: 'high' }
      ]
    },
    {
      id: 'P002',
      name: 'Michael Chen',
      age: 45,
      gender: 'Male',
      room: '205',
      bed: 'B',
      status: 'stable',
      admittingDiagnosis: 'Community-acquired pneumonia',
      vitals: {
        heartRate: { value: 78, unit: 'bpm', range: { min: 60, max: 100 } },
        bloodPressure: { systolic: 118, diastolic: 72, unit: 'mmHg', range: { min: 90, max: 140 } },
        temperature: { value: 98.6, unit: '°F', range: { min: 97, max: 99 } },
        oxygenSat: { value: 96, unit: '%', range: { min: 95, max: 100 } }
      },
      alerts: [
        { message: 'Due for medication', severity: 'medium' }
      ]
    },
    {
      id: 'P003',
      name: 'Emily Rodriguez',
      age: 32,
      gender: 'Female',
      room: '118',
      bed: 'C',
      status: 'moderate',
      admittingDiagnosis: 'Post-operative care following appendectomy',
      vitals: {
        heartRate: { value: 88, unit: 'bpm', range: { min: 60, max: 100 } },
        bloodPressure: { systolic: 122, diastolic: 78, unit: 'mmHg', range: { min: 90, max: 140 } },
        temperature: { value: 98.2, unit: '°F', range: { min: 97, max: 99 } },
        oxygenSat: { value: 98, unit: '%', range: { min: 95, max: 100 } }
      },
      alerts: []
    }
  ]);

  const handleViewDetails = (patientId) => {
    console.log('View details for patient:', patientId);
    // In a real app, this would navigate to patient details page
  };

  const handleUpdateVitals = (patientId) => {
    console.log('Update vitals for patient:', patientId);
    // In a real app, this would open vitals update modal
  };

  const handleAddNote = (patientId) => {
    console.log('Add note for patient:', patientId);
    // In a real app, this would open note entry modal
  };

  const getPatientStats = () => {
    const total = patients.length;
    const critical = patients.filter(p => p.status === 'critical').length;
    const stable = patients.filter(p => p.status === 'stable').length;
    const moderate = patients.filter(p => p.status === 'moderate').length;

    return { total, critical, stable, moderate };
  };

  const stats = getPatientStats();

  return (
    <AppShell
      isAuthed={true}
      conversations={[]}
      activeConversation={null}
      onSelectConversation={() => {}}
      onNewConversation={() => {}}
      onSignOut={() => {}}
      healthStatus="online"
    >
      <div style={{
        padding: 'var(--space-6)',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-4)'
        }}>
          <div>
            <h1 style={{
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--space-2)'
            }}>
              {t('clinicalDashboard.title')}
            </h1>
            <p style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--text-secondary)',
              margin: 0
            }}>
              {t('clinicalDashboard.subtitle')}
            </p>
          </div>
          <Button variant="primary" size="lg">
            {t('clinicalDashboard.addNewPatient')}
          </Button>
        </div>

        {/* Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}>
          <Card variant="elevated" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)'
            }}>
              {stats.total}
            </div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              {t('clinicalDashboard.totalPatients')}
            </div>
          </Card>

          <Card variant="elevated" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--emergency-critical)',
              marginBottom: 'var(--space-2)'
            }}>
              {stats.critical}
            </div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              {t('clinicalDashboard.critical')}
            </div>
          </Card>

          <Card variant="elevated" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--emergency-moderate)',
              marginBottom: 'var(--space-2)'
            }}>
              {stats.moderate}
            </div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              {t('clinicalDashboard.moderate')}
            </div>
          </Card>

          <Card variant="elevated" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--clinical-success)',
              marginBottom: 'var(--space-2)'
            }}>
              {stats.stable}
            </div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              {t('clinicalDashboard.stable')}
            </div>
          </Card>
        </div>

        {/* Patient Cards Grid */}
        <div>
          <h2 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)'
          }}>
            {t('clinicalDashboard.activePatients')}
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: 'var(--space-4)'
          }}>
            {patients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onViewDetails={handleViewDetails}
                onUpdateVitals={handleUpdateVitals}
                onAddNote={handleAddNote}
              />
            ))}
          </div>
        </div>

        {/* Design System Showcase */}
        <Card variant="glass" style={{ marginTop: 'var(--space-6)' }}>
          <h3 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)'
          }}>
            {t('clinicalDashboard.designSystemFeatures')}
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-4)'
          }}>
            <div>
              <h4 style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)'
              }}>
                {t('clinicalDashboard.clinicalColorSystem')}
              </h4>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <Badge variant="error">Critical</Badge>
                <Badge variant="warning">Moderate</Badge>
                <Badge variant="success">Stable</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </div>

            <div>
              <h4 style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)'
              }}>
                {t('clinicalDashboard.buttonVariants')}
              </h4>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <Button variant="primary" size="sm">Primary</Button>
                <Button variant="secondary" size="sm">Secondary</Button>
                <Button variant="ghost" size="sm">Ghost</Button>
              </div>
            </div>

            <div>
              <h4 style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)'
              }}>
                {t('clinicalDashboard.cardVariants')}
              </h4>
              <p style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
                margin: 0
              }}>
                {t('clinicalDashboard.cardVariantsDesc')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export default ClinicalDashboard;