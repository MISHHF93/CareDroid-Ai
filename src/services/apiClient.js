import axios from 'axios';
import appConfig from '../config/appConfig';

const API_BASE_URL = appConfig.api.baseUrl;

const normalizePath = (path) => {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
};

export const buildApiUrl = (path = '') => {
  if (!path) return API_BASE_URL || '';
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${normalizePath(path)}`;
};

export const apiFetch = (path, options) => fetch(buildApiUrl(path), options);

export const buildStreamUrl = (path = '') => {
  const wsBase = appConfig.api.wsUrl
    ? appConfig.api.wsUrl.replace(/^ws/i, 'http')
    : API_BASE_URL;
  if (!path) return wsBase || '';
  if (/^https?:\/\//i.test(path)) return path;
  if (!wsBase) return path;
  return `${wsBase}${normalizePath(path)}`;
};

export const apiAxios = axios.create({
  baseURL: API_BASE_URL || undefined,
});

export default {
  apiFetch,
  apiAxios,
  buildApiUrl,
  buildStreamUrl,
};
