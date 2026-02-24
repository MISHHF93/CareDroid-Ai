import React from 'react';
import { PatientCard } from '../clinical/PatientCard';

/**
 * PatientOverviewSection - Patient monitoring and management section
 * Displays critical patients with filtering and actions
 */
export const PatientOverviewSection = ({
  tr,
  sectionTitle,
  criticalPatients,
  patientStatusFilter,
  statusOptions,
  setPatientStatusFilter,
  patientSearch,
  setPatientSearch,
  expandedPatients,
  setExpandedPatients,
  handleViewPatientDetails,
  handleUpdateVitals,
  handleAddNote
}) => {
  return (
    <section className="dashboard-tier" aria-label="Patient Overview - Current patient status and details">
      <div className="dashboard-tier-head">
        <h2 className="dashboard-tier-title">{tr('dashboard.tierPatients', 'Patient Overview')}</h2>
      </div>

      <div className="dashboard-tier-body">
        <section className="dashboard-patients-section" aria-label="Patient list">
          <div className="dashboard-patient-head">
            <div className="dashboard-patient-title-row">
              <div className="dashboard-patient-title-wrap">
                <h2 className="dashboard-section-title" style={{ marginBottom: 0 }}>
                  {sectionTitle}
                </h2>
                <span className={`dashboard-patient-count${patientStatusFilter === 'critical' ? ' is-critical' : ''}`}>
                  {criticalPatients.length}
                </span>
              </div>
            </div>

            <div className="dashboard-patient-filters">
              <div className="dashboard-chip-group">
                {statusOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setPatientStatusFilter(option.id)}
                    className={`dashboard-chip${option.id === patientStatusFilter ? ' active' : ''}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <input
                type="search"
                className="dashboard-search-input"
                placeholder={tr('dashboard.searchPatientsPlaceholder', 'Search patients...')}
                value={patientSearch}
                onChange={(event) => setPatientSearch(event.target.value)}
              />
            </div>
          </div>

          {criticalPatients.length === 0 ? (
            <div className="dashboard-patient-empty">
              <p style={{ margin: 0 }}>{tr('dashboard.noMatchFilters', 'No patients match current filters')}</p>
            </div>
          ) : (
            <div className="dashboard-patients-list">
              {criticalPatients.map((patient) => {
                const isExpanded = expandedPatients.has(patient.id);
                return (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    compact={!isExpanded}
                    showVitals={isExpanded}
                    showActions={isExpanded}
                    onClick={() => {
                      setExpandedPatients((prev) => {
                        const next = new Set(prev);
                        if (next.has(patient.id)) {
                          next.delete(patient.id);
                        } else {
                          next.add(patient.id);
                        }
                        return next;
                      });
                    }}
                    onViewDetails={handleViewPatientDetails}
                    onUpdateVitals={handleUpdateVitals}
                    onAddNote={handleAddNote}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  );
};