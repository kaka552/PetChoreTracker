import { apiRequest } from './queryClient';
import { Model } from './supabase';

// Get all models
export async function getAllModels(): Promise<Model[]> {
  const response = await apiRequest('GET', '/api/models');
  return response.json();
}

// Get a specific model
export async function getModel(id: number): Promise<Model> {
  const response = await apiRequest('GET', `/api/models/${id}`);
  return response.json();
}

// Create a new model (dev only)
export async function createModel(modelData: {
  model_name: string;
  image_target: string;
  model_file_url: string;
  description: string;
}): Promise<Model> {
  const response = await apiRequest('POST', '/api/models', modelData);
  return response.json();
}

// Update a model (dev only)
export async function updateModel(
  id: number,
  modelData: Partial<Omit<Model, 'id' | 'uploaded_by' | 'created_at'>>
): Promise<Model> {
  const response = await apiRequest('PUT', `/api/models/${id}`, modelData);
  return response.json();
}

// Delete a model (dev only)
export async function deleteModel(id: number): Promise<void> {
  await apiRequest('DELETE', `/api/models/${id}`);
}
