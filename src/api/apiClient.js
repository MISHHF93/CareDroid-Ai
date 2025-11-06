// 100% Open-Source API Client
// Uses local mock data with optional external API integration

import { mockData } from './mockData';

// Configuration for external APIs (optional)
const USE_LOCAL_DATA = true; // Set to false to use real APIs
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

class ApiClient {
  constructor() {
    this.useLocalData = USE_LOCAL_DATA;
    this.backendUrl = BACKEND_URL;
    this.inflight = new Map();
  }

  // HTTP methods for real API calls
  async get(endpoint, config = {}) {
    if (this.useLocalData) {
      return this.handleMockRequest('GET', endpoint, null, config);
    }
    return this.makeHttpRequest('GET', endpoint, null, config);
  }

  async post(endpoint, data = null, config = {}) {
    if (this.useLocalData) {
      return this.handleMockRequest('POST', endpoint, data, config);
    }
    return this.makeHttpRequest('POST', endpoint, data, config);
  }

  async put(endpoint, data = null, config = {}) {
    if (this.useLocalData) {
      return this.handleMockRequest('PUT', endpoint, data, config);
    }
    return this.makeHttpRequest('PUT', endpoint, data, config);
  }

  async delete(endpoint, config = {}) {
    if (this.useLocalData) {
      return this.handleMockRequest('DELETE', endpoint, null, config);
    }
    return this.makeHttpRequest('DELETE', endpoint, null, config);
  }

  async makeHttpRequest(method, endpoint, data = null, config = {}) {
    const url = `${this.backendUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    // Add auth token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const requestConfig = {
      method,
      headers,
      ...config,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      requestConfig.body = JSON.stringify(data);
      headers['Idempotency-Key'] = headers['Idempotency-Key'] || `ck-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    const key = `${method}:${endpoint}:${requestConfig.body || ''}`;
    if (method !== 'GET') {
      const existing = this.inflight.get(key);
      if (existing) return existing;
    }

    const run = (async () => {
      const response = await fetch(url, requestConfig);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return {
        data: await response.json(),
        status: response.status,
        statusText: response.statusText,
      };
    })();

    if (method !== 'GET') this.inflight.set(key, run);
    try {
      const result = await run;
      this.inflight.delete(key);
      return result;
    } catch (err) {
      this.inflight.delete(key);
      throw err;
    }
  }

  async handleMockRequest(method, endpoint, data, _config) {
    // Handle auth endpoints with mock data
    if (endpoint.startsWith('/auth/')) {
      return this.handleAuthMock(method, endpoint, data);
    }
    
    // Handle subscription endpoints
    if (endpoint.startsWith('/subscriptions/')) {
      return this.handleSubscriptionMock(method, endpoint, data);
    }

    // For other endpoints, return mock data
    await this.delay();
    return { data: { message: 'Mock response' }, status: 200 };
  }

  async handleAuthMock(method, endpoint, data) {
    await this.delay();
    
    if (endpoint === '/auth/me') {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (user.id) {
        return { data: user, status: 200 };
      }
      return { data: {
        id: 'user-1',
        email: 'demo@example.com',
        emailVerified: true,
        name: 'Demo User',
        role: 'physician',
        specialty: 'Internal Medicine'
      }, status: 200 };
    }
    
    if (endpoint === '/auth/login' && method === 'POST') {
      const user = {
        id: 'user-1',
        email: data.email,
        emailVerified: true,
        name: 'Demo User',
        token: 'mock-token-' + Date.now()
      };
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('accessToken', user.token);
      return { data: { accessToken: user.token, refreshToken: 'mock-refresh-token' }, status: 200 };
    }
    
    if (endpoint === '/auth/register' && method === 'POST') {
      const user = {
        id: 'user-' + Date.now(),
        email: data.email,
        emailVerified: false,
        name: data.name || 'New User',
      };
      return { data: user, status: 201 };
    }
    
    return { data: { message: 'Auth endpoint not implemented in mock' }, status: 200 };
  }

  async handleSubscriptionMock(method, endpoint, _data) {
    await this.delay();
    
    if (endpoint === '/subscriptions/current') {
      return { data: { tier: 'FREE', status: 'ACTIVE' }, status: 200 };
    }
    
    if (endpoint === '/subscriptions/plans') {
      return { data: [
        { id: 'free', name: 'Free', price: 0, features: ['Basic tools'] },
        { id: 'pro', name: 'Pro', price: 14.99, features: ['AI features', 'Advanced tools'] },
        { id: 'institutional', name: 'Institutional', price: null, features: ['All features', 'Custom integrations'] }
      ], status: 200 };
    }
    
    return { data: { message: 'Subscription endpoint not implemented in mock' }, status: 200 };
  }

  // Simulate async delay for realistic feel
  delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Entity CRUD operations
  entities = {
    drugs: {
      list: async () => {
        await this.delay();
        return mockData.drugs || [];
      },
      get: async (id) => {
        await this.delay();
        const item = mockData.drugs?.find(item => item.id === id);
        if (!item) throw new Error('Drug not found');
        return item;
      },
      create: async (data) => {
        await this.delay();
        const newItem = { ...data, id: Date.now().toString(), created_date: new Date().toISOString() };
        mockData.drugs = [...(mockData.drugs || []), newItem];
        return newItem;
      },
      update: async (id, data) => {
        await this.delay();
        const index = mockData.drugs?.findIndex(item => item.id === id);
        if (index === -1) throw new Error('Drug not found');
        mockData.drugs[index] = { ...mockData.drugs[index], ...data };
        return mockData.drugs[index];
      },
      delete: async (id) => {
        await this.delay();
        mockData.drugs = mockData.drugs?.filter(item => item.id !== id);
        return { success: true };
      },
    },
    protocols: {
      list: async () => {
        await this.delay();
        return mockData.protocols || [];
      },
      get: async (id) => {
        await this.delay();
        const item = mockData.protocols?.find(item => item.id === id);
        if (!item) throw new Error('Protocol not found');
        return item;
      },
      create: async (data) => {
        await this.delay();
        const newItem = { ...data, id: Date.now().toString(), created_date: new Date().toISOString() };
        mockData.protocols = [...(mockData.protocols || []), newItem];
        return newItem;
      },
      update: async (id, data) => {
        await this.delay();
        const index = mockData.protocols?.findIndex(item => item.id === id);
        if (index === -1) throw new Error('Protocol not found');
        mockData.protocols[index] = { ...mockData.protocols[index], ...data };
        return mockData.protocols[index];
      },
      delete: async (id) => {
        await this.delay();
        mockData.protocols = mockData.protocols?.filter(item => item.id !== id);
        return { success: true };
      },
    },
  };

  // Integrations with open-source alternatives
  integrations = {
    Core: {
      InvokeLLM: async (params) => {
        await this.delay(800);
        
        // Option 1: Use OpenAI API directly if key is provided
        if (OPENAI_API_KEY && !this.useLocalData) {
          try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: 'gpt-4',
                messages: [{ role: 'user', content: params.prompt }],
                response_format: params.response_json_schema ? { type: 'json_object' } : undefined,
              }),
            });
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            return params.response_json_schema ? JSON.parse(content) : content;
          } catch (error) {
            console.warn('OpenAI API failed, using mock response:', error);
          }
        }
        
        // Option 2: Mock intelligent response based on prompt
        return this.generateMockLLMResponse(params);
      },
      
      SendEmail: async (params) => {
        await this.delay();
        console.log('Email would be sent:', params);
        return { success: true, messageId: 'mock-' + Date.now() };
      },
      
      UploadFile: async (_params) => {
        await this.delay();
        return { 
          url: 'https://via.placeholder.com/500',
          fileId: 'mock-file-' + Date.now() 
        };
      },
      
      GenerateImage: async (params) => {
        await this.delay();
        return { url: `https://via.placeholder.com/512?text=${encodeURIComponent(params.prompt || 'Generated Image')}` };
      },
      
      ExtractDataFromUploadedFile: async (_params) => {
        await this.delay();
        return { extractedText: 'Mock extracted data from file', confidence: 0.95 };
      },
      
      CreateFileSignedUrl: async (_params) => {
        await this.delay();
        return { signedUrl: 'https://example.com/signed-url-' + Date.now() };
      },
      
      UploadPrivateFile: async (_params) => {
        await this.delay();
        return { fileId: 'private-' + Date.now(), success: true };
      },
    },
  };

  // Mock LLM response generator
  generateMockLLMResponse(params) {
    const prompt = params.prompt.toLowerCase();
    
    // Generate contextual responses based on prompt content
    if (params.response_json_schema) {
      // Return mock structured data
      if (prompt.includes('workflow') || prompt.includes('clinical')) {
        return {
          clinical_priorities: [
            { priority: 'urgent', issue: 'Medication interaction detected', rationale: 'Review current medications for potential conflicts' }
          ],
          recommended_tools: [
            { tool: 'Drug Interactions', reason: 'Multiple active medications', specific_action: 'Check for contraindications', urgency: 'high' }
          ],
          suggested_assessments: [
            { assessment: 'Medication review', tool_to_use: 'Drug Database', parameters: 'Current medication list' }
          ],
          drug_safety_alerts: ['Monitor for potential drug interactions'],
          care_optimization: 'Streamline medication regimen and monitor for adverse effects'
        };
      }
      
      if (prompt.includes('differential') || prompt.includes('diagnosis')) {
        return {
          differentials: [
            { diagnosis: 'Common Cold', probability: 0.7, rationale: 'Symptoms align with viral URI' },
            { diagnosis: 'Allergic Rhinitis', probability: 0.2, rationale: 'Seasonal pattern possible' }
          ],
          recommended_tests: ['CBC', 'Allergy panel'],
          red_flags: ['Monitor for worsening symptoms']
        };
      }
    }
    
    // Default text response
    return 'This is a mock AI response. To use real AI, configure VITE_OPENAI_API_KEY in your .env file and set USE_LOCAL_DATA to false in apiClient.js.';
  }

  // Auth with local storage
  auth = {
    me: async () => {
      await this.delay();
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return user.id ? user : {
        id: 'user-1',
        email: 'demo@example.com',
        name: 'Demo User',
        role: 'physician',
        specialty: 'Internal Medicine'
      };
    },
    
    login: async (credentials) => {
      await this.delay();
      const user = {
        id: 'user-1',
        email: credentials.email,
        name: 'Demo User',
        token: 'mock-token-' + Date.now()
      };
      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    },
    
    updateMe: async (updates) => {
      await this.delay();
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const updated = { ...user, ...updates };
      localStorage.setItem('currentUser', JSON.stringify(updated));
      return updated;
    },
    
    logout: async () => {
      localStorage.removeItem('currentUser');
    },
  };
}

// Export the API client instance
export const api = new ApiClient();
