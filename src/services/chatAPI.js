import { apiFetch } from './apiClient';

export const sendMessage = async (conversationId, userId, payload = {}, authToken) => {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await apiFetch('/api/chat/message', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      conversationId,
      userId,
      ...payload,
    }),
  });

  return response;
};

export const executeClinicalTool = async (conversationId, userId, payload = {}, authToken) => {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await apiFetch('/api/chat/tool', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      conversationId,
      userId,
      ...payload,
    }),
  });

  return response;
};

export const executeClinicaTool = executeClinicalTool;

export default {
  sendMessage,
  executeClinicalTool,
  executeClinicaTool,
};
