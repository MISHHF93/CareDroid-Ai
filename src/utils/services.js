// Services layer - wraps the API client for easier imports
import { api } from '@/api/apiClient';

// Export entities
export const entities = api.entities;

// Export auth service
export const authService = api.auth;

// Export AI/integration service
export const aiService = {
  invokeLLM: api.integrations.Core.InvokeLLM,
  uploadFile: api.integrations.Core.UploadFile,
  generateImage: api.integrations.Core.GenerateImage,
};

// Initialize sample data (no-op since we have mock data now)
export const initializeSampleData = async () => {
  console.log('Using mock data - no initialization needed');
  return true;
};
