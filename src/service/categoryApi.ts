import { apiClient } from './apiConfig';

export interface CategoryApi {
  id: number;
  name: string;
}

export interface CreateCategoryInput {
  name: string;
}

export interface UpdateCategoryInput {
  name: string;
}

export const getCategories = () =>
  apiClient.get<{ status: boolean; data: CategoryApi[] }>('/categories');

export const getCategory = (id: number) =>
  apiClient.get<{ status: boolean; data: CategoryApi }>(`/categories/${id}`);

export const createCategory = (data: CreateCategoryInput) =>
  apiClient.post<{ status: boolean; data: CategoryApi }>('/categories', data);

export const updateCategory = (id: number, data: UpdateCategoryInput) =>
  apiClient.put<{ status: boolean; data: CategoryApi }>(`/categories/${id}`, data);

export const deleteCategory = (id: number) =>
  apiClient.delete<{ status: boolean; message: string }>(`/categories/${id}`);

export const importCategoriesCsv = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post<{
    status: boolean;
    imported_count: number;
    errors: Record<number, string[]>;
  }>('/categories/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
