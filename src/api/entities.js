import { api } from './apiClient';

export const Drug = api.entities.Drug;
export const Protocol = api.entities.Protocol;
export const LabValue = api.entities.LabValue;
export const Procedure = api.entities.Procedure;
export const AuditLog = api.entities.AuditLog;
export const MedicalImage = api.entities.MedicalImage;
export const SavedQuery = api.entities.SavedQuery;
export const ClinicalNote = api.entities.ClinicalNote;

// Auth service
export const User = api.auth;