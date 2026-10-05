import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const getHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const predictMachine = async (data) => {
  const response = await api.post('/predict', data);
  return response.data;
};

export const explainPrediction = async (data) => {
  const response = await api.post('/explain', data);
  return response.data;
};

export const runWhatIf = async (original, scenario) => {
  const response = await api.post('/what-if', { original, scenario });
  return response.data;
};

export const uploadBatchCsv = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/batch-predict', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const exportBatchCsv = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/batch-predict/export', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob',
  });
  return response.data;
};

export const getModelInfo = async () => {
  const response = await api.get('/model-info');
  return response.data;
};

export const getMetrics = async () => {
  const response = await api.get('/metrics');
  return response.data;
};

export const getFeatureImportance = async () => {
  const response = await api.get('/feature-importance');
  return response.data;
};

export const getShapSummary = async () => {
  const response = await api.get('/shap-summary');
  return response.data;
};

export const getShapBeeswarmImageUrl = () => {
  return `${API_BASE_URL}/shap-beeswarm-image`;
};

export const getRiskDistribution = async () => {
  const response = await api.get('/risk-distribution');
  return response.data;
};

export const getDatasetSummary = async () => {
  const response = await api.get('/dataset-summary');
  return response.data;
};

export default api;
