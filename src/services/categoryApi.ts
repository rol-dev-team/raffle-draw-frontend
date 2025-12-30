import clientApi from './apiConfig';

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
  clientApi.get<{ status: boolean; data: CategoryApi[] }>('/categories');

export const getCategory = (id: number) =>
  clientApi.get<{ status: boolean; data: CategoryApi }>(`/categories/${id}`);

export const createCategory = (data: CreateCategoryInput) =>
  clientApi.post<{ status: boolean; data: CategoryApi }>('/categories', data);

export const updateCategory = (id: number, data: UpdateCategoryInput) =>
  clientApi.put<{ status: boolean; data: CategoryApi }>(`/categories/${id}`, data);

export const deleteCategory = (id: number) =>
  clientApi.delete<{ status: boolean; message: string }>(`/categories/${id}`);

export const importCategoriesCsv = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  return clientApi.post<{
    status: boolean;
    imported_count: number;
    errors: Record<number, string[]>;
  }>('/categories/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};